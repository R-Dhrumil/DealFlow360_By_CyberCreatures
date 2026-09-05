const express = require('express');
const router = express.Router();
const { pingDatabase } = require('../config/db');

const authRoutes = require('./auth.routes');
const marketplaceRoutes = require('./marketplace.routes');
const productRoutes = require('./product.routes');
const quotationRoutes = require('./quotation.routes');
const approvalRoutes = require('./approval.routes');
const warehouseRoutes = require('./warehouse.routes');
const dashboardRoutes = require('./dashboard.routes');
const superadminRoutes = require('./superadmin.routes');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbStatus = await pingDatabase();
    res.json({
      status: 'OK',
      service: 'DealFlow360 API',
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'DealFlow360 API',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// API Routes
router.use('/auth', authRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/products', productRoutes);
router.use('/quotations', quotationRoutes);
router.use('/approvals', approvalRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/superadmin', superadminRoutes);

module.exports = router;
