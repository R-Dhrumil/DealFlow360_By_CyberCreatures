const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/environment');
const masterRouter = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const { globalRateLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Rate limiting
app.use(globalRateLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
