import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check DB connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error: any) {
    console.warn('⚠️ Remote PostgreSQL connection failed (falling back to resilient store):', error.message || error);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server listen error:', err);
  });
}

startServer();
