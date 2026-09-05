import PDFDocument from 'pdfkit-table';

/**
 * Streams formatted PDF document with tables directly to Express response
 * @param {import('express').Response} res - Express Response object
 * @param {Object} options
 * @param {string} [options.title] - PDF Document Title
 * @param {Array<Object>} options.data - Array of data objects
 * @param {Array<{label: string, property: string, width?: number}>} [options.headers] - Table header specifications
 * @param {string} [options.filename] - Output PDF filename (default: 'report.pdf')
 */
export const exportToPdf = async (res, { title = 'Data Report', data = [], headers, filename = 'report.pdf' }) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

  doc.pipe(res);

  let activeHeaders = headers;
  if (!activeHeaders && data.length > 0) {
    activeHeaders = Object.keys(data[0]).map((key) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      property: key,
    }));
  }

  const table = {
    title: title,
    subtitle: `Generated on: ${new Date().toLocaleString()}`,
    headers: activeHeaders || [{ label: 'Data', property: 'value' }],
    datas: data,
  };

  await doc.table(table, {
    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
    prepareRow: () => doc.font('Helvetica').fontSize(9),
  });

  doc.end();
};
