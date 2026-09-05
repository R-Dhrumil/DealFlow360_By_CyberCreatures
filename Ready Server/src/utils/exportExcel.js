import ExcelJS from 'exceljs';

/**
 * Streams formatted Excel (.xlsx) spreadsheet directly to Express response
 * @param {import('express').Response} res - Express Response object
 * @param {Object} options
 * @param {Array<Object>} options.data - Array of row objects to export
 * @param {Array<{header: string, key: string, width?: number}>} [options.columns] - Optional column mapping
 * @param {string} [options.filename] - Custom output filename (default: 'export.xlsx')
 * @param {string} [options.sheetName] - Worksheet title (default: 'Data Report')
 */
export const exportToExcel = async (res, { data = [], columns, filename = 'export.xlsx', sheetName = 'Data Report' }) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    worksheet.addRow(['No data available']);
  } else {
    // Auto-infer columns from first row if not explicitly passed
    const activeColumns = columns || Object.keys(data[0]).map((key) => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      key: key,
    }));

    worksheet.columns = activeColumns;

    // Populate row data
    data.forEach((item) => {
      worksheet.addRow(item);
    });

    // Auto-adjust column widths based on longest string value
    worksheet.columns.forEach((col) => {
      let maxLen = col.header ? col.header.length : 10;
      data.forEach((row) => {
        const val = row[col.key];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      col.width = Math.min(Math.max(maxLen + 3, 12), 40);
    });

    // Style Header Row (Dark Blue background, bold white text)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F4E78' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 24;
  }

  // Set HTTP headers for file download
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

  // Stream workbook to Express response
  await workbook.xlsx.write(res);
  res.end();
};
