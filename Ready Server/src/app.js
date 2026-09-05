import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/ApiError.js';
import { ApiResponse } from './utils/ApiResponse.js';

const app = express();

// Ensure public uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security Headers (Configured to support Swagger UI & Cross-Origin media assets)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI inline scripts
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows frontend to fetch uploaded files
  })
);

// CORS configuration (Hackathon-friendly wildcard & credentials support)
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 500, // 500 requests per 15 mins for fast hackathon iteration
  message: { success: false, statusCode: 429, message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', limiter);

// Request Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request Logging
app.use(morgan('dev'));

// Static Uploads Folder (Directly serve uploaded images & documents)
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  return ApiResponse.send(res, 200, { status: 'UP', timestamp: new Date() }, 'Hackathon Backend API is operational');
});

// Swagger UI Documentation Mount
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: '🚀 Hackathon API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// API Routes Mount
app.use('/api/v1', routes);

// Catch-all 404 handler (Guarantees JSON response for invalid frontend endpoints)
app.use('*', (req, res, next) => {
  next(new ApiError(404, `Route '${req.originalUrl}' not found on this server.`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
