import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';
import { exportToExcel } from '../utils/exportExcel.js';
import { exportToPdf } from '../utils/exportPdf.js';

const MOCK_DATA = [
  { id: 1, title: 'Procurement Order #101', category: 'Procurement', department: 'SupplyChain', amount: 5000 },
  { id: 2, title: 'Procurement Order #102', category: 'Procurement', department: 'SupplyChain', amount: 12000 },
  { id: 3, title: 'Managerial Performance Review Q3', category: 'Management', department: 'General', amount: 0 },
  { id: 4, title: 'General User Workspace Item', category: 'General', department: 'General', amount: 100 },
];

export const getScopedData = catchAsync(async (req, res) => {
  const userRole = req.user.role;
  let result = [];

  if (userRole === 'ADMIN') {
    result = MOCK_DATA;
  } else if (userRole === 'PROCUREMENT_OFFICER') {
    result = MOCK_DATA.filter((item) => item.category === 'Procurement');
  } else if (userRole === 'MANAGER') {
    result = MOCK_DATA.filter((item) => item.category === 'Management' || item.department === req.user.department);
  } else {
    result = MOCK_DATA.filter((item) => item.category === 'General');
  }

  return ApiResponse.send(
    res,
    200,
    {
      userRole,
      filterApplied: req.dbFilter || {},
      count: result.length,
      data: result,
    },
    `Data scoped for role '${userRole}' fetched successfully`
  );
});

export const exportSampleExcel = catchAsync(async (req, res) => {
  await exportToExcel(res, {
    data: MOCK_DATA,
    filename: 'Hackathon_Sample_Report.xlsx',
    sheetName: 'Sample Orders',
  });
});

export const exportSamplePdf = catchAsync(async (req, res) => {
  await exportToPdf(res, {
    title: 'Hackathon Sample Report',
    data: MOCK_DATA,
    filename: 'Hackathon_Sample_Report.pdf',
  });
});
