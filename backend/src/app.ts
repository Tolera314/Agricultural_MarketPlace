import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env first, fallback to local
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import authRouter from './routes/auth.routes.js';
import workerRouter from './routes/worker.routes.js';
import locationRouter from './routes/location.routes.js';
import adminRouter from './routes/admin.routes.js';
import buyerRouter from './routes/buyer.routes.js';
import onboardingRouter from './routes/onboarding.routes.js';

import cookieParser from 'cookie-parser';

const app = express();

// Security and CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(cookieParser());

// Configure permissive CSP headers so browser DevTools and local clients never get blocked
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' http://localhost:3000 http://localhost:5000; connect-src 'self' http://localhost:3000 http://localhost:5000 ws://localhost:3000 ws://localhost:5000 https:; img-src 'self' data: blob: https:;"
  );
  next();
});

app.use(express.json());

// Root endpoint: Prevents "Cannot GET /" 404
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'Agriculture Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      worker: '/api/worker',
      location: '/api/location',
      admin: '/api/admin',
      buyer: '/api/buyer',
    },
  });
});

// Chrome DevTools well-known probe handler: Prevents 404 & CSP violations
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({});
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/worker', workerRouter);
app.use('/api/location', locationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/buyer', buyerRouter);
app.use('/api/onboarding', onboardingRouter);

// Catch-all 404 JSON handler (prevents default HTML 404 with default-src 'none')
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      status: 404,
    },
  });
});

// Global Error Handler with User-Friendly Translation
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);

  let status = err.status || 500;
  let message = err.message || 'An unexpected error occurred. Please try again.';

  if (err.code === 'P2002') {
    status = 409;
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
    message = `A record with this ${target || 'information'} already exists. Please check your entries.`;
  } else if (err.code === 'P2003') {
    status = 400;
    message = 'A selected zone, location, or reference record does not exist. Please check your selections.';
  } else if (err.code === 'P2025') {
    status = 404;
    message = 'The requested record could not be found.';
  } else if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'The uploaded file exceeds the 5 MB maximum size limit. Please choose a smaller file.';
    } else {
      message = `Document upload error: ${err.message}`;
    }
  } else if (status >= 500) {
    message = 'An unexpected server error occurred while processing your request. Please try again.';
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      ...(err.field ? { field: err.field } : {}),
    },
  });
});

export default app;
