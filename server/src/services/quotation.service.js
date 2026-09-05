const quotationRepository = require('../repositories/quotation.repository');
const approvalRepository = require('../repositories/approval.repository');
const db = require('../config/db');
const { computeBlendedRiskScore } = require('./riskScore.service');
const ApiError = require('../utils/apiError');
const { emitCompanyRoleNotification, emitUserNotification, broadcastPipelineUpdate } = require('./socket.service');
const { logAction } = require('./audit.service');

const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: fetch the effective max discount for a given user
//  Priority: users.max_discount_percent (per-user) → discount_tiers (role-level)
// ─────────────────────────────────────────────────────────────────────────────
async function getUserDiscountAuthority(companyId, userId) {
  const roleDefaults = {
    sales_rep: 10,
    sales_manager: 20,
    finance: 35,
    finance_manager: 35,
    admin: 100,
    super_admin: 100
  };

  // 1. Check per-user override first
  const userRes = await db.query(
    'SELECT role, max_discount_percent FROM users WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)',
    [userId, companyId]
  );
  if (userRes.rows.length === 0) return { maxDiscount: 10, role: 'sales_rep' };

  const user = userRes.rows[0];
  if (user.role === 'super_admin') return { maxDiscount: 100, role: 'super_admin' };

  if (user.max_discount_percent !== null && user.max_discount_percent !== undefined) {
    return { maxDiscount: parseFloat(user.max_discount_percent), role: user.role };
  }

  // 2. Fall back to role-level discount_tiers
  const tierRes = await db.query(
    'SELECT max_discount_percent FROM discount_tiers WHERE company_id = $1 AND LOWER(tier_name) = LOWER($2)',
    [companyId, user.role]
  );
  if (tierRes.rows.length > 0) {
    return { maxDiscount: parseFloat(tierRes.rows[0].max_discount_percent), role: user.role };
  }

  return { maxDiscount: roleDefaults[user.role] ?? 20, role: user.role };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: check if any quotation line falls below its product floor price
//  Returns: { belowFloor: bool, violations: [...] }
// ─────────────────────────────────────────────────────────────────────────────
async function checkFloorPrice(quotationId) {
  const linesRes = await db.query(
    `SELECT ql.product_id, ql.unit_price, ql.quantity, ql.discount_percent,
            p.name as product_name, p.floor_price,
            (ql.unit_price * (1 - ql.discount_percent / 100)) as net_unit_price,
            (ql.unit_price * ql.quantity * (1 - ql.discount_percent / 100)) as line_total
     FROM quotation_lines ql
     JOIN products p ON ql.product_id = p.id
     WHERE ql.quotation_id = $1`,
    [quotationId]
  );

  const violations = [];
  for (const line of linesRes.rows) {
    if (line.floor_price !== null && line.floor_price !== undefined) {
      const netUnitPrice = parseFloat(line.net_unit_price);
      const floorPrice = parseFloat(line.floor_price);
      if (netUnitPrice < floorPrice) {
        violations.push({
          productName: line.product_name,
          productId: line.product_id,
          requestedPrice: netUnitPrice,
          floorPrice,
          discountPercent: parseFloat(line.discount_percent),
          shortfall: floorPrice - netUnitPrice
        });
      }
    }
  }

  return { belowFloor: violations.length > 0, violations };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: check if any discount exceeds a given maxDiscount ceiling
// ─────────────────────────────────────────────────────────────────────────────
async function checkDiscountAuthority(quotationId, maxDiscount) {
  const linesRes = await db.query(
    'SELECT product_id, discount_percent FROM quotation_lines WHERE quotation_id = $1',
    [quotationId]
  );

  const violations = linesRes.rows.filter(l => parseFloat(l.discount_percent) > maxDiscount);
  return { exceedsAuthority: violations.length > 0, violations, maxDiscount };
}

class QuotationService {
  async createQuotation(companyId, salesRepId, customerInfo, lines, inquiryId = null) {
    let customerId = typeof customerInfo === 'string' ? customerInfo : customerInfo?.customerId;
    const customerName = typeof customerInfo === 'object' ? customerInfo?.customerName : null;
    const customerEmail = typeof customerInfo === 'object' ? customerInfo?.customerEmail : null;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      throw ApiError.badRequest('Quotation lines array is required and cannot be empty');
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Resolve or create customer
      if (customerEmail && customerEmail.trim()) {
        const cleanEmail = customerEmail.trim().toLowerCase();
        const existingCust = await client.query(
          'SELECT id FROM customers WHERE LOWER(email) = LOWER($1)',
          [cleanEmail]
        );
        if (existingCust.rows.length > 0) {
          customerId = existingCust.rows[0].id;
        }
      }

      // If still not resolved, check by customer name (e.g. Acme Corp)
      if (!customerId && customerName && customerName.trim()) {
        const cleanName = customerName.trim().toLowerCase();
        const existingByName = await client.query(
          'SELECT id FROM customers WHERE LOWER(name) = LOWER($1) OR LOWER(name) LIKE $2 LIMIT 1',
          [cleanName, `%${cleanName}%`]
        );
        if (existingByName.rows.length > 0) {
          customerId = existingByName.rows[0].id;
        }
      }

      if (!customerId && customerEmail && customerEmail.trim()) {
        const cleanEmail = customerEmail.trim().toLowerCase();
        const newCustId = 'cust_' + crypto.randomUUID().substring(0, 8);
        const nameToUse = (customerName && customerName.trim()) ? customerName.trim() : cleanEmail.split('@')[0];
        await client.query(
          'INSERT INTO customers (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
          [newCustId, nameToUse, cleanEmail, 'guest']
        );
        customerId = newCustId;
      }

      if (!customerId) {
        const firstCust = await client.query('SELECT id FROM customers LIMIT 1');
        customerId = firstCust.rows[0]?.id || 'cust1';
      }

      // Lock product prices and floor prices (server-side — never trust client prices)
      const productIds = lines.map(l => l.productId);
      const productsRes = await client.query(
        'SELECT id, base_price, floor_price FROM products WHERE id = ANY($1::varchar[])',
        [productIds]
      );

      const securePrices = {};
      const floorPrices = {};
      productsRes.rows.forEach(p => {
        securePrices[p.id] = parseFloat(p.base_price);
        floorPrices[p.id] = p.floor_price ? parseFloat(p.floor_price) : null;
      });

      const effectiveCompanyId = companyId || 'c1';
      const effectiveRepId = salesRepId || 'u4';

      let totalBase = 0;
      let totalNet = 0;
      for (const line of lines) {
        const truePrice = securePrices[line.productId] !== undefined
          ? securePrices[line.productId]
          : parseFloat(line.unitPrice || line.basePrice || 0);

        const safeDiscount = Math.max(0, Math.min(100, parseFloat(line.discountPercent || 0)));
        const qty = line.quantity || 1;
        totalBase += truePrice * qty;
        totalNet += truePrice * (1 - safeDiscount / 100) * qty;
      }
      
      let overallDiscount = 0;
      if (totalBase > 0) {
        overallDiscount = ((totalBase - totalNet) / totalBase) * 100;
      }
      const finalDiscount = parseFloat(overallDiscount.toFixed(2));

      // Create quotation record (with inquiry_id if provided)
      const qId = 'q_' + Math.floor(1000 + Math.random() * 9000);
      const quotationRes = await client.query(
        `INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, status, inquiry_id, discount_percent)
         VALUES ($1, $2, $3, $4, 'draft', $5, $6)
         RETURNING *`,
        [qId, effectiveCompanyId, customerId, effectiveRepId, inquiryId || null, finalDiscount]
      );
      const quotation = quotationRes.rows[0];

      await logAction('quotation', quotation.id, effectiveRepId, 'created', {
        status: 'draft',
        inquiry_id: inquiryId
      });

      for (const line of lines) {
        const truePrice = securePrices[line.productId] !== undefined
          ? securePrices[line.productId]
          : parseFloat(line.unitPrice || line.basePrice || 0);

        const safeDiscount = Math.max(0, Math.min(100, parseFloat(line.discountPercent || 0)));
        const qlId = 'ql_' + crypto.randomUUID();

        await client.query(
          `INSERT INTO quotation_lines (id, quotation_id, product_id, quantity, unit_price, discount_percent, line_type, customer_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [qlId, quotation.id, line.productId, line.quantity || 1, truePrice, safeDiscount, line.lineType || 'one_time', customerId]
        );
      }

      await client.query('COMMIT');

      emitCompanyRoleNotification(effectiveCompanyId, ['sales_manager', 'admin'], {
        type: 'info',
        title: 'New Quotation Created',
        message: `Quotation #${quotation.id} created for ${customerName || customerEmail || 'Customer'}.`,
        link: `/app/quote/${quotation.id}`
      });
      broadcastPipelineUpdate(effectiveCompanyId, { quotationId: quotation.id, newStatus: 'draft' });

      return { quotationId: quotation.id, customerId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Submit a draft quotation — runs 3 checks:
   *  1. Blended risk score (existing category ceiling logic)
   *  2. Salesperson discount authority (new)
   *  3. Floor price check (new)
   * The most restrictive result wins.
   */
  async submitQuotation(companyId, quotationId, userId) {
    const client = await db.pool.connect();
    let riskResult;
    let quotation;
    let finalStatus;
    let approvalLevel = null;

    try {
      await client.query('BEGIN');

      // 1. Lock the row
      quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId, client);
      if (!quotation) throw ApiError.notFound('Quotation not found');
      if (quotation.status !== 'draft') {
        throw ApiError.conflict(`Quotation is already processed (Status: ${quotation.status})`);
      }

      // 2. Fetch lines with categories
      const linesRaw = await quotationRepository.findQuotationLinesWithCategory(quotationId);
      const lines = linesRaw.map(row => ({
        productId: row.product_id,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price),
        discountPercent: parseFloat(row.discount_percent),
        category: row.category
      }));

      // 3. Existing risk score calculation
      const tierCeiling = await approvalRepository.getCustomerTierCeiling(companyId, quotation.customer_id);
      const categoryCeilings = await approvalRepository.getCategoryCeilings(companyId);
      const chains = await approvalRepository.getApprovalChains(companyId);
      riskResult = computeBlendedRiskScore(lines, tierCeiling, categoryCeilings, chains);

      // 4. NEW — Salesperson discount authority check
      const repId = userId || quotation.sales_rep_id;
      const { maxDiscount: repMaxDiscount } = await getUserDiscountAuthority(companyId, repId);
      const authorityCheck = await checkDiscountAuthority(quotationId, repMaxDiscount);

      // 5. NEW — Floor price check
      const floorCheck = await checkFloorPrice(quotationId);

      // 6. Determine final status per workflow hierarchy:
      // SALESPERSON QUOTATION:
      //  ├─ Within authority + above floor => CUSTOMER (status = 'approved')
      //  └─ Requires escalation => MANAGER (status = 'pending_approval', approval_level = 'manager')
      if (!authorityCheck.exceedsAuthority && !floorCheck.belowFloor) {
        finalStatus = 'approved';
        approvalLevel = null;
      } else {
        finalStatus = 'pending_approval';
        approvalLevel = 'manager';
      }

      // 7. Update quotation
      const updatedRes = await client.query(
        `UPDATE quotations
         SET status = $1, blended_risk_score = $2, approval_level = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [finalStatus, riskResult.blendedScore, approvalLevel, quotationId]
      );

      await client.query('COMMIT');

      await logAction('quotation', quotationId, repId, 'submitted', {
        status: finalStatus,
        blended_score: riskResult.blendedScore,
        rep_max_discount: repMaxDiscount,
        exceeds_authority: authorityCheck.exceedsAuthority,
        below_floor: floorCheck.belowFloor,
        approval_level: approvalLevel
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    broadcastPipelineUpdate(companyId, { quotationId, newStatus: finalStatus });

    const salesRepId = quotation.sales_rep_id;
    if (finalStatus === 'approved') {
      emitUserNotification(salesRepId, {
        type: 'success',
        title: '✅ Quote Auto-Approved',
        message: `Quote #${quotationId} is within all limits and was auto-approved!`,
        link: `/app/quote/${quotationId}`
      });
    } else if (finalStatus === 'pending_approval') {
      emitCompanyRoleNotification(companyId, ['sales_manager', 'admin'], {
        type: 'warning',
        title: '⏳ Manager Approval Required',
        message: `Quote #${quotationId} requires manager review (discount/floor price).`,
        link: `/app/approvals`
      });
      emitUserNotification(salesRepId, {
        type: 'info',
        title: 'Submitted for Manager Approval',
        message: `Quote #${quotationId} sent to Sales Manager for review.`,
        link: `/app/quote/${quotationId}`
      });
    } else if (finalStatus === 'pending_finance_approval') {
      emitCompanyRoleNotification(companyId, ['finance', 'admin'], {
        type: 'warning',
        title: 'High-Risk Finance Review',
        message: `Quote #${quotationId} requires finance approval.`,
        link: `/app/approvals`
      });
    }

    return {
      quotationId,
      status: finalStatus,
      approvalLevel,
      blendedScore: riskResult.blendedScore,
      requiredApproval: riskResult.requiredApproval
    };
  }

  /**
   * Approve a quotation.
   * Higher priority accounts (Sales Manager, Finance Manager, Admin, Super Admin)
   * can give approval to any active quotation (draft, inquiry, pending_approval, etc.).
   * Constraint: Cannot approve if any quotation line discount exceeds the approver's set limit.
   * Floor price override: Admin / Super Admin can override floor price; Managers escalate to Admin.
   */
  async approveQuotation(companyId, quotationId, userRole, userId, modifiedLines = null) {
    const client = await db.pool.connect();
    let quotation;

    try {
      await client.query('BEGIN');
      quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId, client);
      if (!quotation) throw ApiError.notFound('Quotation not found');

      // 1. Role validation: Higher priority accounts can approve
      const higherPriorityRoles = ['sales_manager', 'finance', 'finance_manager', 'admin', 'super_admin'];
      if (!higherPriorityRoles.includes(userRole)) {
        throw ApiError.forbidden('Sales Reps cannot directly approve quotations. Please submit the quotation for review.');
      }

      // 2. Status validation: Terminal statuses cannot be re-approved
      if (['accepted', 'signed', 'cancelled'].includes(quotation.status)) {
        throw ApiError.conflict(`Cannot approve a quotation that is already ${quotation.status}`);
      }

      // If already approved, return gracefully
      if (quotation.status === 'approved') {
        await client.query('COMMIT');
        return { quotationId, status: 'approved', approvalLevel: null, message: 'Quotation is already approved.' };
      }

      // Specific escalated role gates
      if (quotation.status === 'pending_finance_approval' && !['finance_manager', 'finance', 'admin', 'super_admin'].includes(userRole)) {
        throw ApiError.forbidden('Only Finance Manager or Admin can approve this quotation');
      }
      if (quotation.status === 'pending_admin_approval' && !['admin', 'super_admin'].includes(userRole)) {
        throw ApiError.forbidden('Only Company Admin or Super Admin can approve this below-floor quotation');
      }

      // 3. If modifier sent updated line discounts, apply them first
      if (modifiedLines && Array.isArray(modifiedLines)) {
        for (const l of modifiedLines) {
          const safeDiscount = Math.max(0, Math.min(100, parseFloat(l.discountPercent || 0)));
          await client.query(
            'UPDATE quotation_lines SET discount_percent = $1 WHERE id = $2 AND quotation_id = $3',
            [safeDiscount, l.id, quotationId]
          );
        }
        await logAction('quotation', quotationId, userId, 'lines_modified_on_approval', {
          modified_by_role: userRole,
          lines: modifiedLines
        });
      }

      // 4. Fetch approver's discount limit
      const { maxDiscount: approverLimit } = await getUserDiscountAuthority(companyId, userId);

      // 5. Fetch all quotation lines
      const linesRes = await client.query(
        `SELECT ql.*, p.name as product_name, p.floor_price,
                (ql.unit_price * (1 - ql.discount_percent / 100)) as net_unit_price
         FROM quotation_lines ql
         JOIN products p ON ql.product_id = p.id
         WHERE ql.quotation_id = $1`,
        [quotationId]
      );

      if (linesRes.rows.length === 0) {
        throw ApiError.badRequest('Cannot approve an empty quotation without products. Please add products and pricing first.');
      }

      // 6. ENFORCE: Cannot give more discount than their limit
      const discountViolations = linesRes.rows.filter(l => parseFloat(l.discount_percent || 0) > approverLimit);
      if (discountViolations.length > 0) {
        const maxRequestedDiscount = Math.max(...discountViolations.map(l => parseFloat(l.discount_percent)));
        const offendingProduct = discountViolations[0].product_name || 'Product';
        throw ApiError.badRequest(
          `Approval limit exceeded: Your role limit allows up to ${approverLimit}% discount, but this quote offers ${maxRequestedDiscount}% on "${offendingProduct}". Please reduce the discount or request approval from a higher priority account.`
        );
      }

      // 7. Floor price check
      const floorCheck = await checkFloorPrice(quotationId);
      let newStatus = 'approved';
      let newApprovalLevel = null;

      if (floorCheck.belowFloor) {
        // Only Admin or Super Admin has floor override authority
        if (!['admin', 'super_admin'].includes(userRole)) {
          // Escalate to Admin
          newStatus = 'pending_admin_approval';
          newApprovalLevel = 'admin';
        }
      }

      // 8. Commit update to DB
      await client.query(
        `UPDATE quotations
         SET status = $1, approval_level = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newStatus, newApprovalLevel, quotationId]
      );

      await client.query('COMMIT');

      await logAction('quotation', quotationId, userId, `approved_by_${userRole}`, {
        new_status: newStatus,
        approval_level: newApprovalLevel,
        approver_limit: approverLimit,
        below_floor: floorCheck.belowFloor
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    broadcastPipelineUpdate(companyId, { quotationId, newStatus: newStatus });

    if (quotation) {
      if (newStatus === 'approved') {
        emitUserNotification(quotation.sales_rep_id, {
          type: 'success',
          title: '✅ Quotation Approved',
          message: `Quote #${quotationId} has been approved by ${userRole.replace('_', ' ')}.`,
          link: `/app/quote/${quotationId}`
        });
        emitCompanyRoleNotification(companyId, ['admin', 'sales_manager'], {
          type: 'success',
          title: 'Quotation Approved',
          message: `Quote #${quotationId} approved.`,
          link: `/app/quote/${quotationId}`
        });
      } else if (newStatus === 'pending_admin_approval') {
        emitCompanyRoleNotification(companyId, ['admin', 'super_admin'], {
          type: 'warning',
          title: '⚠️ Admin Approval Required',
          message: `Quote #${quotationId} is below floor price and requires Company Admin override.`,
          link: `/app/approvals`
        });
        emitUserNotification(quotation.sales_rep_id, {
          type: 'info',
          title: 'Escalated to Admin',
          message: `Quote #${quotationId} is below floor price and has been escalated to Company Admin.`,
          link: `/app/quote/${quotationId}`
        });
      }
    }

    return { quotationId, status: newStatus, approvalLevel: newApprovalLevel };
  }

  async rejectQuotation(companyId, quotationId, userRole, userId, reason = '') {
    const client = await db.pool.connect();
    let quotation;
    try {
      await client.query('BEGIN');
      quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId, client);
      if (!quotation) throw ApiError.notFound('Quotation not found');

      if (['accepted', 'signed', 'cancelled'].includes(quotation.status)) {
        throw ApiError.conflict(`Cannot reject a quotation that is already ${quotation.status}`);
      }

      if (quotation.status === 'pending_finance_approval' && !['finance_manager', 'admin', 'super_admin'].includes(userRole)) {
        throw ApiError.forbidden('Only Finance Manager or Admin can reject this high-risk quotation');
      }
      if (quotation.status === 'pending_admin_approval' && !['admin', 'super_admin'].includes(userRole)) {
        throw ApiError.forbidden('Only Admin can reject this quotation');
      }

      await quotationRepository.updateQuotationStatusAndScore(
        quotationId, 'rejected', quotation.blended_risk_score, client
      );

      await client.query('COMMIT');
      await logAction('quotation', quotationId, userId, `rejected_by_${userRole}`, { reason });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    broadcastPipelineUpdate(companyId, { quotationId, newStatus: 'rejected' });

    if (quotation) {
      emitUserNotification(quotation.sales_rep_id, {
        type: 'error',
        title: '❌ Quotation Rejected',
        message: `Quote #${quotationId} was rejected by ${userRole.replace('_', ' ')}. ${reason ? `Reason: ${reason}` : ''}`,
        link: `/app/quote/${quotationId}`
      });
    }

    return { quotationId, status: 'rejected' };
  }

  async ensurePaymentTable(client) {
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(100) PRIMARY KEY,
          quotation_id VARCHAR(100),
          company_id VARCHAR(100),
          customer_id VARCHAR(100),
          amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
          payment_type VARCHAR(50) DEFAULT 'one-time',
          payment_method VARCHAR(50) DEFAULT 'cod',
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.warn('Could not auto-ensure payments table:', e.message);
    }
  }

  async confirmQuotation(companyId, quotationId, paymentData = {}) {
    const client = await db.pool.connect();
    let quotation;
    try {
      await client.query('BEGIN');
      quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId || null, client);
      if (!quotation) throw ApiError.notFound('Quotation not found');

      if (['confirmed', 'closed'].includes(quotation.status)) {
        await client.query('COMMIT');
        return { quotationId, status: quotation.status, message: `Quotation is already ${quotation.status}.` };
      }

      if (quotation.status === 'blocked') {
        throw ApiError.conflict('Cannot confirm a blocked quotation due to too many failed payment attempts.');
      }

      if (quotation.status === 'rejected') {
        throw ApiError.conflict('Cannot confirm a rejected quotation.');
      }

      let finalPaymentStatus = 'completed';
      let returnMessage = 'Payment successful.';
      let returnQuotationStatus = 'closed';

      if (paymentData.transactionResult === 'failed') {
        finalPaymentStatus = 'failed';
        const attempts = (quotation.payment_attempts || 0) + 1;
        if (attempts >= 3) {
          returnQuotationStatus = 'blocked';
          returnMessage = 'Quotation blocked due to 3 failed payment attempts.';
        } else {
          returnQuotationStatus = quotation.status;
          returnMessage = `Payment failed. You have ${3 - attempts} attempt(s) remaining.`;
        }
      } else {
        if ((paymentData.paymentMethod || 'cod').toLowerCase() === 'cod') {
          finalPaymentStatus = 'pending';
        }
      }

      // 1. Insert Payment Record
      if (paymentData.paymentMethod) {
        await this.ensurePaymentTable(client);

        let validCustomerId = quotation.customer_id;
        if (validCustomerId) {
          try {
            const custExists = await client.query('SELECT id FROM customers WHERE id = $1', [validCustomerId]);
            if (custExists.rows.length === 0) validCustomerId = null;
          } catch {
            validCustomerId = null;
          }
        }

        let validCompanyId = quotation.company_id;
        if (validCompanyId) {
          try {
            const compExists = await client.query('SELECT id FROM companies WHERE id = $1', [validCompanyId]);
            if (compExists.rows.length === 0) validCompanyId = null;
          } catch {
            validCompanyId = null;
          }
        }

        const normalizedType = (paymentData.paymentType === 'recurring' || paymentData.paymentType === 'subscription-monthly')
          ? 'subscription-monthly'
          : 'one-time';
        const rawMethod = (paymentData.paymentMethod || 'cod').toLowerCase();
        const normalizedMethod = (rawMethod === 'cod' || rawMethod.includes('cash')) ? 'cod' : (rawMethod.includes('upi') ? 'upi' : 'manual');
        const paymentId = 'pay_' + crypto.randomBytes(6).toString('hex');

        try {
          await client.query(`
            INSERT INTO payments (id, quotation_id, company_id, customer_id, amount, payment_type, payment_method, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            paymentId,
            quotationId,
            validCompanyId,
            validCustomerId,
            parseFloat(paymentData.amount) || 0,
            normalizedType,
            normalizedMethod,
            finalPaymentStatus
          ]);
        } catch (insertErr) {
          console.warn('Payment record insert notice:', insertErr.message);
          try {
            await client.query(`
              INSERT INTO payments (id, quotation_id, amount, payment_method, status)
              VALUES ($1, $2, $3, $4, $5)
            `, [paymentId, quotationId, parseFloat(paymentData.amount) || 0, normalizedMethod, finalPaymentStatus]);
          } catch (fallbackErr) {
            console.warn('Payment record fallback notice:', fallbackErr.message);
          }
        }
      }

      // 2. Update Quotation Status
      if (paymentData.transactionResult === 'failed') {
        const attempts = (quotation.payment_attempts || 0) + 1;
        if (returnQuotationStatus === 'blocked') {
          await client.query('UPDATE quotations SET status = $1, payment_attempts = $2 WHERE id = $3', ['blocked', attempts, quotationId]);
        } else {
          await client.query('UPDATE quotations SET payment_attempts = $1 WHERE id = $2', [attempts, quotationId]);
        }
      } else {
        await quotationRepository.updateQuotationStatusAndScore(
          quotationId, 'closed', quotation.blended_risk_score || 0, client
        );
      }

      await client.query('COMMIT');

      // Return immediately if failed, so we don't broadcast confirmation
      if (paymentData.transactionResult === 'failed') {
        return { quotationId, status: returnQuotationStatus, message: returnMessage };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const effectiveCompanyId = companyId || quotation.company_id;
    broadcastPipelineUpdate(effectiveCompanyId, { quotationId, newStatus: 'confirmed' });

    if (quotation) {
      emitCompanyRoleNotification(effectiveCompanyId, ['admin', 'sales_manager', 'operations'], {
        type: 'success',
        title: '🎉 Deal Confirmed!',
        message: `Quotation #${quotationId} was accepted & confirmed! Operations hub notified.`,
        link: `/app/operations`
      });
      emitUserNotification(quotation.sales_rep_id, {
        type: 'success',
        title: '🎉 Deal Confirmed!',
        message: `Your Quote #${quotationId} was accepted & confirmed by the customer!`,
        link: `/app/quote/${quotationId}`
      });
    }

    return { quotationId, status: 'confirmed' };
  }

  /**
   * Validate discount in real-time (called by QuotationBuilder UI before submit).
   * Returns: repMaxDiscount, floorPriceViolations, exceedsAuthority indicator.
   */
  async validateDiscountLive(companyId, userId, lines) {
    const { maxDiscount, role } = await getUserDiscountAuthority(companyId, userId);

    // Fetch product floor prices
    const productIds = lines.map(l => l.productId);
    const productsRes = await db.query(
      'SELECT id, base_price, floor_price FROM products WHERE id = ANY($1::varchar[])',
      [productIds]
    );
    const productMap = {};
    productsRes.rows.forEach(p => { productMap[p.id] = p; });

    const lineResults = lines.map(line => {
      const product = productMap[line.productId];
      const discount = parseFloat(line.discountPercent || 0);
      const basePrice = product ? parseFloat(product.base_price) : parseFloat(line.unitPrice || 0);
      const floorPrice = product?.floor_price ? parseFloat(product.floor_price) : null;
      const netPrice = basePrice * (1 - discount / 100);
      const qty = parseInt(line.quantity || 1);

      const exceedsAuthority = discount > maxDiscount;
      const belowFloor = floorPrice !== null && netPrice < floorPrice;

      return {
        productId: line.productId,
        productName: line.productName,
        basePrice,
        netPrice,
        lineTotal: netPrice * qty,
        discount,
        floorPrice,
        exceedsAuthority,
        belowFloor,
        requiresApproval: exceedsAuthority || belowFloor
      };
    });

    const requiresManagerApproval = lineResults.some(l => l.requiresApproval);

    return {
      repMaxDiscount: maxDiscount,
      repRole: role,
      lineResults,
      requiresManagerApproval
    };
  }
}

module.exports = new QuotationService();
