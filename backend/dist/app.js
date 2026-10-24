import express, {} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes.js';
import workerRouter from './routes/worker.routes.js';
dotenv.config();
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRouter);
app.use('/api/worker', workerRouter);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});
export default app;
//# sourceMappingURL=app.js.map