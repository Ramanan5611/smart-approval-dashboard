import express from 'express';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import requestRoutes from './routes/requests';
import userRoutes from './routes/users';
import databaseRoutes from './routes/database';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/database', databaseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints:`);
      console.log(`  - POST /api/auth/login`);
      console.log(`  - POST /api/auth/register`);
      console.log(`  - GET /api/requests`);
      console.log(`  - POST /api/requests`);
      console.log(`  - PUT /api/requests/:id`);
      console.log(`  - GET /api/users`);
      console.log(`  - POST /api/users`);
      console.log(`  - PUT /api/users/:id`);
      console.log(`  - DELETE /api/users/:id`);
      console.log(`  - POST /api/users/:id/reset-password`);
      console.log(`  - GET /api/database/collections`);
      console.log(`  - GET /api/database/collections/:name`);
      console.log(`  - DELETE /api/database/collections/:name/:id`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
