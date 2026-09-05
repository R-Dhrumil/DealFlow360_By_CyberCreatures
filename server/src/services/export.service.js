const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * PDF Quotation Exporter Service
 */
function generateQuotationPDF(quotation, stream) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  // Title
  doc.fontSize(20).text(`DealFlow360 Quotation #${quotation.id ? quotation.id.split('-')[0] : '101'}`, { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Customer: ${quotation.customer_name || 'Acme Corp'}`);
  doc.text(`Status: ${quotation.status || 'Draft'}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  // Table Headers
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Product Name', 50, doc.y, { width: 200 });
  doc.text('Qty', 260, doc.y, { width: 50, align: 'right' });
  doc.text('Unit Price', 320, doc.y, { width: 80, align: 'right' });
  doc.text('Discount', 410, doc.y, { width: 60, align: 'right' });
  doc.text('Total', 480, doc.y, { width: 70, align: 'right' });
  doc.moveDown();

  doc.font('Helvetica');
  const lines = quotation.lines || [
    { product_name: 'Enterprise Server X1', quantity: 2, unit_price: 5000, discount_percent: 10 },
    { product_name: 'SaaS Platform License', quantity: 50, unit_price: 100, discount_percent: 15 }
  ];

  lines.forEach(line => {
    const netPrice = line.unit_price * (1 - line.discount_percent / 100);
    const lineTotal = netPrice * line.quantity;

    const y = doc.y;
    doc.text(line.product_name, 50, y, { width: 200 });
    doc.text(line.quantity.toString(), 260, y, { width: 50, align: 'right' });
    doc.text(`$${line.unit_price.toFixed(2)}`, 320, y, { width: 80, align: 'right' });
    doc.text(`${line.discount_percent}%`, 410, y, { width: 60, align: 'right' });
    doc.text(`$${lineTotal.toFixed(2)}`, 480, y, { width: 70, align: 'right' });
    doc.moveDown();
  });

  doc.end();
}

/**
 * Excel Quotations Exporter Service
 */
async function generateQuotationsExcel(quotations) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Quotations Report');

  worksheet.columns = [
    { header: 'Quotation ID', key: 'id', width: 20 },
    { header: 'Customer', key: 'customer_name', width: 25 },
    { header: 'Sales Rep', key: 'rep_name', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Risk Score (%)', key: 'blended_risk_score', width: 15 },
    { header: 'Created Date', key: 'created_at', width: 20 }
  ];

  const rows = quotations || [
    { id: 'Q-101', customer_name: 'Acme Corp', rep_name: 'Alex Rep', status: 'approved', blended_risk_score: 0.0, created_at: new Date().toISOString() },
    { id: 'Q-102', customer_name: 'Beta Industries', rep_name: 'Alex Rep', status: 'pending_approval', blended_risk_score: 8.5, created_at: new Date().toISOString() }
  ];

  rows.forEach(row => {
    worksheet.addRow(row);
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = {
  generateQuotationPDF,
  generateQuotationsExcel
};
