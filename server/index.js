const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const productsRoutes = require('./routes/products.routes');
const quotationsRoutes = require('./routes/quotations.routes');
const approvalsRoutes = require('./routes/approvals.routes');
const warehousesRoutes = require('./routes/warehouses.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const superadminRoutes = require('./routes/superadmin.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/superadmin', superadminRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('DealFlow360 API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
