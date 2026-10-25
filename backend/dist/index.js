import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        // Check DB connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.warn('⚠️ Remote PostgreSQL connection failed (falling back to resilient store):', error.message || error);
    }
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
startServer();
//# sourceMappingURL=index.js.map