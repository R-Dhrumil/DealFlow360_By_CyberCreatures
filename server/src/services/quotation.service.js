const quotationRepository = require('../repositories/quotation.repository');
const approvalRepository = require('../repositories/approval.repository');
const inventoryRepository = require('../repositories/inventory.repository');
const userRepository = require('../repositories/user.repository');
const productRepository = require('../repositories/product.repository');
const customerRepository = require('../repositories/customer.repository');
const companyRepository = require('../repositories/company.repository');
const warehouseRepository = require('../repositories/warehouse.repository');
const db = require('../config/db');
const riskEngineService = require('./riskEngine.service');
const ApiError = require('../utils/apiError');
const { emitCompanyRoleNotification, emitUserNotification, broadcastPipelineUpdate, broadcastInventoryUpdate } = require('./socket.service');
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
  const user = await userRepository.findDiscountAuthority(userId, companyId);
  if (!user) return { maxDiscount: 10, role: 'sales_rep' };

  if (user.role === 'super_admin') return { maxDiscount: 100, role: 'super_admin' };

  if (user.max_discount_percent !== null && user.max_discount_percent !== undefined) {
    return { maxDiscount: parseFloat(user.max_discount_percent), role: user.role };
  }

  // 2. Fall back to role-level discount_tiers
  const tier = await userRepository.findDiscountTierByRole(companyId, user.role);
  if (tier) {
    return { maxDiscount: parseFloat(tier.max_discount_percent), role: user.role };
  }

  return { maxDiscount: roleDefaults[user.role] ?? 20, role: user.role };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: check if any quotation line falls below its product floor price
//  Returns: { belowFloor: bool, violations: [...] }
// ─────────────────────────────────────────────────────────────────────────────
async function checkFloorPrice(quotationId) {
  const lines = await quotationRepository.findLinesForFloorCheck(quotationId);

  const violations = [];
  for (const line of lines) {
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
  const lines = await quotationRepository.findLineDiscounts(quotationId);
  const violations = lines.filter(l => parseFloat(l.discount_percent) > maxDiscount);
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

      // Resolve or create customer via repository
      if (customerEmail && customerEmail.trim()) {
        const existingCust = await customerRepository.findByEmail(customerEmail, client);
        if (existingCust) {
          customerId = existingCust.id;
        }
      }

      // If still not resolved, check by customer name
      if (!customerId && customerName && customerName.trim()) {
        const existingByName = await customerRepository.findByNameLike(customerName, client);
        if (existingByName) {
          customerId = existingByName.id;
        }
      }

      if (!customerId && customerEmail && customerEmail.trim()) {
        const cleanEmail = customerEmail.trim().toLowerCase();
        const newCustId = 'cust_' + crypto.randomUUID().substring(0, 8);
        const nameToUse = (customerName && customerName.trim()) ? customerName.trim() : cleanEmail.split('@')[0];
        await customerRepository.create(nameToUse, cleanEmail, 'guest', newCustId, client);
        customerId = newCustId;
      }

      if (!customerId) {
        const firstCust = await customerRepository.findFirst(client);
        customerId = firstCust?.id || 'cust1';
      }

      // Lock product prices and floor prices (server-side — never trust client prices)
      const productIds = lines.map(l => l.productId);
      const productsRows = await productRepository.findPricesByIds(productIds, client);

      const securePrices = {};
      const floorPrices = {};
      productsRows.forEach(p => {
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

      // Create quotation record via repository (with inquiry_id if provided)
      const quotation = await quotationRepository.createQuotationRecord({
        id: 'q_' + Math.floor(1000 + Math.random() * 9000),
        companyId: effectiveCompanyId,
        customerId,
        salesRepId: effectiveRepId,
        status: 'draft',
        inquiryId: inquiryId || null,
        discountPercent: finalDiscount
      }, client);

      await logAction('quotation', quotation.id, effectiveRepId, 'created', {
        status: 'draft',
        inquiry_id: inquiryId
      });

      const lineRecords = lines.map(line => {
        const truePrice = securePrices[line.productId] !== undefined
          ? securePrices[line.productId]
          : parseFloat(line.unitPrice || line.basePrice || 0);
        const safeDiscount = Math.max(0, Math.min(100, parseFloat(line.discountPercent || 0)));
        return {
          quotationId: quotation.id,
          productId: line.productId,
          quantity: line.quantity || 1,
          unitPrice: truePrice,
          discountPercent: safeDiscount,
          lineType: 'one_time',
          customerId
        };
      });
      await quotationRepository.createQuotationLines(lineRecords, client);

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

      // 3. New Risk Engine calculation (persists line-level details)
      const riskData = await riskEngineService.calculateQuotationRisk(quotationId, companyId, client);
      riskResult = {
        blendedScore: riskData.riskScore,
        requiresManager: riskData.requiresManager,
        requiresFinance: riskData.requiresFinance
      };

      // 4. Salesperson discount authority check
      const repId = userId || quotation.sales_rep_id;
      const { maxDiscount: repMaxDiscount } = await getUserDiscountAuthority(companyId, repId);
      const authorityCheck = await checkDiscountAuthority(quotationId, repMaxDiscount);

      // 5. Floor price check
      const floorCheck = await checkFloorPrice(quotationId);

      // 6. Determine final status per workflow hierarchy
      // We now strictly use the state machine logic mapped to risk levels
      if (floorCheck.belowFloor) {
         finalStatus = 'pending_admin_approval';
         approvalLevel = 'admin';
      } else if (riskData.requiresFinance) {
         finalStatus = 'pending_finance'; // or pending_finance_approval
         approvalLevel = 'finance';
      } else if (riskData.requiresManager || authorityCheck.exceedsAuthority) {
         finalStatus = 'pending_manager'; // or pending_approval
         approvalLevel = 'manager';
      } else {
         finalStatus = 'approved';
         approvalLevel = null;
      }

      // 7. Update quotation via repository
      await quotationRepository.updateStatusAndApproval(quotationId, finalStatus, riskResult.blendedScore, approvalLevel, client);

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
    } else if (finalStatus === 'pending_manager' || finalStatus === 'pending_approval') {
      emitCompanyRoleNotification(companyId, ['sales_manager', 'admin'], {
        type: 'warning',
        title: '⏳ Manager Approval Required',
        message: `Quote #${quotationId} requires manager review (High Risk or Discount/Floor).`,
        link: `/app/approvals`
      });
      emitUserNotification(salesRepId, {
        type: 'info',
        title: 'Submitted for Manager Approval',
        message: `Quote #${quotationId} sent to Sales Manager for review.`,
        link: `/app/quote/${quotationId}`
      });
    } else if (finalStatus === 'pending_finance' || finalStatus === 'pending_finance_approval') {
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
    let newStatus;
    let newApprovalLevel;

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
      if (['pending_finance', 'pending_finance_approval'].includes(quotation.status) && !['finance_manager', 'finance', 'admin', 'super_admin'].includes(userRole)) {
        throw ApiError.forbidden('Only Finance or Admin can approve this high-risk quotation');
      }
      if (quotation.status === 'pending_admin_approval' && !['admin', 'super_admin'].includes(userRole)) {
        throw ApiError.forbidden('Only Company Admin or Super Admin can approve this below-floor quotation');
      }

      // 3. If modifier sent updated line discounts, apply them via batch update
      if (modifiedLines && Array.isArray(modifiedLines)) {
        await quotationRepository.batchUpdateLineItems(quotationId, modifiedLines, client);
        await logAction('quotation', quotationId, userId, 'lines_modified_on_approval', {
          modified_by_role: userRole,
          lines: modifiedLines
        });
      }

      // 4. Fetch approver's discount limit
      const { maxDiscount: approverLimit } = await getUserDiscountAuthority(companyId, userId);

      // 5. Fetch all quotation lines via repository
      const linesRows = await quotationRepository.findLinesWithProducts(quotationId, client);

      if (linesRows.length === 0) {
        throw ApiError.badRequest('Cannot approve an empty quotation without products. Please add products and pricing first.');
      }

      // 6. ENFORCE: Cannot give more discount than their limit
      const discountViolations = linesRows.filter(l => parseFloat(l.discount_percent || 0) > approverLimit);
      if (discountViolations.length > 0) {
        const maxRequestedDiscount = Math.max(...discountViolations.map(l => parseFloat(l.discount_percent)));
        const offendingProduct = discountViolations[0].product_name || 'Product';
        throw ApiError.badRequest(
          `Approval limit exceeded: Your role limit allows up to ${approverLimit}% discount, but this quote offers ${maxRequestedDiscount}% on "${offendingProduct}". Please reduce the discount or request approval from a higher priority account.`
        );
      }

      // 7. Floor price and workflow check
      const floorCheck = await checkFloorPrice(quotationId);
      newStatus = 'approved';
      newApprovalLevel = null;

      if (floorCheck.belowFloor) {
        // Only Admin or Super Admin has floor override authority
        if (!['admin', 'super_admin'].includes(userRole)) {
          // Escalate to Admin
          newStatus = 'pending_admin_approval';
          newApprovalLevel = 'admin';
        }
      } else if (quotation.finance_required && !['finance', 'finance_manager', 'admin', 'super_admin'].includes(userRole)) {
         // If a Sales Manager is approving, but Finance is required, advance to Finance step
         newStatus = 'pending_finance';
         newApprovalLevel = 'finance';
      }

      // 8. Commit update to DB via repository
      await quotationRepository.updateStatusAndApproval(quotationId, newStatus, quotation.blended_risk_score || 0, newApprovalLevel, client);

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
        let validCustomerId = quotation.customer_id;
        if (validCustomerId) {
          const custExists = await customerRepository.findById(validCustomerId, client);
          if (!custExists) validCustomerId = null;
        }

        let validCompanyId = quotation.company_id;
        if (validCompanyId) {
          try {
            const compExists = await companyRepository.findById(validCompanyId, client);
            if (!compExists) validCompanyId = null;
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

        await quotationRepository.recordPayment({
          id: paymentId,
          quotationId,
          companyId: validCompanyId,
          customerId: validCustomerId,
          amount: parseFloat(paymentData.amount) || 0,
          paymentType: normalizedType,
          paymentMethod: normalizedMethod,
          status: finalPaymentStatus
        }, client);
      }

      // 2. Update Quotation Status
      if (paymentData.transactionResult === 'failed') {
        const attempts = (quotation.payment_attempts || 0) + 1;
        const newStatus = returnQuotationStatus === 'blocked' ? 'blocked' : null;
        await quotationRepository.updatePaymentAttempts(quotationId, attempts, newStatus, client);
      } else {
        await quotationRepository.updateQuotationStatusAndScore(
          quotationId, 'closed', quotation.blended_risk_score || 0, client
        );

        // Auto-deduct inventory stock for customer purchase
        try {
          const splitsRows = await warehouseRepository.getFulfillmentSplitsWithProducts(quotationId, client);

          if (splitsRows.length > 0) {
            // Deduct based on configured fulfillment splits
            for (const split of splitsRows) {
              const qty = parseInt(split.quantity, 10) || 1;
              await inventoryRepository.adjustStock(
                client,
                quotation.company_id || 'c1',
                split.warehouse_id,
                split.product_id,
                quotation.customer_id || null,
                'out',
                qty,
                `Fulfillment Split Dispatch (Quote #${quotationId})`,
                quotationId
              );
            }
          } else {
            // Deduct dynamically across warehouses using deductProductStock
            const linesRows = await quotationRepository.findLineProductQuantities(quotationId, client);

            for (const line of linesRows) {
              const prodId = line.product_id;
              const qty = parseInt(line.quantity, 10) || 1;
              await inventoryRepository.deductProductStock(
                client,
                quotation.company_id || 'c1',
                prodId,
                qty,
                quotation.customer_id || null,
                `Customer Purchase (Quote #${quotationId})`,
                quotationId
              );
            }
          }
        } catch (invErr) {
          console.warn('Auto stock deduction warning:', invErr.message);
        }
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
    broadcastInventoryUpdate(effectiveCompanyId, { quotationId, type: 'customer_purchase' });

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
  async validateDiscountLive(companyId, userId, lines, customerId = null) {
    const { maxDiscount, role } = await getUserDiscountAuthority(companyId, userId);

    // Call the new risk engine (without persisting)
    const riskData = await riskEngineService.calculateLiveRisk(companyId, customerId, lines);

    // Fetch product floor prices via repository for floor price checking
    const productIds = lines.map(l => l.productId);
    const productsRows = await productRepository.findPricesByIds(productIds);
    const productMap = {};
    productsRows.forEach(p => { productMap[p.id] = p; });

    // We merge our risk engine line details with floor price checks
    const lineResults = riskData.lineDetails.map(rLine => {
      const product = productMap[rLine.productId];
      const floorPrice = product?.floor_price ? parseFloat(product.floor_price) : null;
      
      const basePrice = product ? parseFloat(product.base_price) : parseFloat(rLine.unitPrice || 0);
      const netPrice = basePrice * (1 - rLine.discountPercent / 100);
      
      const exceedsAuthority = rLine.discountPercent > maxDiscount;
      const belowFloor = floorPrice !== null && netPrice < floorPrice;

      return {
        productId: rLine.productId,
        productName: rLine.productName,
        basePrice,
        netPrice,
        lineTotal: netPrice * rLine.quantity,
        discount: rLine.discountPercent,
        allowedDiscount: rLine.allowedDiscount,
        excessDiscount: rLine.excessDiscount,
        floorPrice,
        exceedsAuthority,
        belowFloor,
        isViolation: rLine.isViolation,
        requiresApproval: exceedsAuthority || belowFloor || rLine.isViolation
      };
    });

    const requiresManagerApproval = riskData.requiresManager || lineResults.some(l => l.requiresApproval);

    return {
      repMaxDiscount: maxDiscount,
      repRole: role,
      riskScore: riskData.riskScore,
      riskLevel: riskData.riskLevel,
      requiresManager: riskData.requiresManager,
      requiresFinance: riskData.requiresFinance,
      violationsCount: riskData.violationsCount,
      totalDiscountAmount: riskData.totalDiscountAmount,
      excessDiscountAmount: riskData.excessDiscountAmount,
      lineResults,
      requiresManagerApproval
    };
  }

  /**
   * Get intelligent ranked upsell and cross-sell recommendations
   * based on co-purchase history, active promotions, and category affinity.
   */
  async getRecommendations(companyId, currentProductIds = []) {
    const allProducts = await productRepository.findByCompany(companyId);
    if (!allProducts || allProducts.length === 0) return [];

    const productIdsArray = Array.isArray(currentProductIds)
      ? currentProductIds
      : (typeof currentProductIds === 'string' && currentProductIds.trim())
        ? currentProductIds.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const synergies = await quotationRepository.getCoPurchaseSynergies(companyId, productIdsArray);
    const coPurchaseMap = new Map();
    synergies.forEach(s => {
      coPurchaseMap.set(s.product_id, parseInt(s.co_purchase_count, 10) || 0);
    });

    const currentProducts = allProducts.filter(p => productIdsArray.includes(p.id));
    const currentCategories = new Set(currentProducts.map(p => p.category));
    const candidates = allProducts.filter(p => !productIdsArray.includes(p.id));

    const ranked = candidates.map(product => {
      let score = 0;
      const reasons = [];

      const coCount = coPurchaseMap.get(product.id) || 0;
      if (coCount > 0) {
        score += coCount * 30;
        reasons.push(`Co-purchased in ${coCount} previous quote${coCount > 1 ? 's' : ''}`);
      }

      if (product.is_promoted) {
        score += 50;
        reasons.push('Active promotional deal');
      }

      if (currentCategories.has('Hardware') && product.category === 'Services') {
        score += 40;
        reasons.push('Hardware attach: Service & SLA bundle');
      } else if (currentCategories.has('Hardware') && product.category === 'Software') {
        score += 35;
        reasons.push('Hardware attach: Enterprise software integration');
      } else if (currentCategories.has('Software') && product.category === 'Services') {
        score += 35;
        reasons.push('Software attach: Implementation & support');
      } else if (currentCategories.size === 0 && product.is_promoted) {
        score += 25;
        reasons.push('Featured popular offering');
      }

      const margin = parseFloat(product.margin_percent || 40);
      if (margin >= 70) {
        score += 20;
        reasons.push('High margin accelerator');
      } else if (margin >= 50) {
        score += 10;
      }

      return {
        ...product,
        base_price: parseFloat(product.base_price),
        floor_price: product.floor_price ? parseFloat(product.floor_price) : null,
        margin_percent: margin,
        score,
        coPurchaseCount: coCount,
        recommendationReason: reasons.join(' • ') || 'Recommended complement'
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  }
}

module.exports = new QuotationService();

