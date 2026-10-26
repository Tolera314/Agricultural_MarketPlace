import express, {} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes.js';
import workerRouter from './routes/worker.routes.js';
import locationRouter from './routes/location.routes.js';
import adminRouter from './routes/admin.routes.js';
import buyerRouter from './routes/buyer.routes.js';
import onboardingRouter from './routes/onboarding.routes.js';
dotenv.config();
const app = express();
// Security and CORS middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
// Configure permissive CSP headers so browser DevTools and local clients never get blocked
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:3000 http://localhost:5000; connect-src 'self' http://localhost:3000 http://localhost:5000 ws://localhost:3000 ws://localhost:5000 https:; img-src 'self' data: blob: https:;");
    next();
});
app.use(express.json());
// Root endpoint: Prevents "Cannot GET /" 404
app.get('/', (req, res) => {
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
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({});
});
// Health check endpoint
app.get('/health', (req, res) => {
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
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: `Cannot ${req.method} ${req.originalUrl}`,
            status: 404,
        },
    });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500,
        },
    });
});
export default app;
//# sourceMappingURL=app.js.map