const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/environment');
const masterRouter = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const { globalRateLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false
}));

// CORS configuration - Allow dynamic origins for local dev, IP network, and production
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

// Rate limiting
app.use(globalRateLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads for logo/favicon
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Root Status
app.get('/', (req, res) => {
  res.json({
    name: 'DealFlow360 API',
    version: '1.0.0',
    status: 'Running',
    documentation: '/api/health'
  });
});

// Master API Routes
app.use('/api', masterRouter);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
