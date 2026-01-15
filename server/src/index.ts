import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import lawyerRoutes from './routes/lawyerRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import signatureRoutes from './routes/signatureRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import mongoose from 'mongoose';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Log startup info for debugging
console.log('=== DealGuard Server Starting ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${process.env.PORT || '5000 (default)'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'configured' : 'NOT SET'}`);
console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'not set'}`);
console.log(`AI_SERVICE_URL: ${process.env.AI_SERVICE_URL || 'not set'}`);
console.log('================================');

// Connect to database (non-blocking)
connectDB();

const app = express();

// Initialize Sentry (wrapped in try-catch to prevent crashes if not configured)
try {
  if (process.env.SENTRY_DSN_BACKEND) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN_BACKEND,
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 1.0,
    });
    // The request handler must be the first middleware on the app
    Sentry.setupExpressErrorHandler(app);
    console.log('Sentry initialized successfully');
  } else {
    console.warn('SENTRY_DSN_BACKEND not set, Sentry error tracking disabled');
  }
} catch (error) {
  console.error('Failed to initialize Sentry:', error);
}

// Middleware
// Trust proxy headers (required for Render/Heroku to get correct req.protocol)
app.set('trust proxy', 1);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/search', searchRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'unknown',
      ai_service: 'unknown',
    }
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      health.services.mongodb = 'connected';
    } else {
      health.services.mongodb = 'disconnected';
      health.status = 'degraded';
    }

    // Check AI Service
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    try {
      const aiResponse = await axios.get(`${aiServiceUrl}/health`, { timeout: 2000 });
      if (aiResponse.status === 200) {
        health.services.ai_service = 'connected';
      } else {
        health.services.ai_service = 'error';
        health.status = 'degraded';
      }
    } catch (e) {
      health.services.ai_service = 'disconnected';
      health.status = 'degraded';
    }
  } catch (error) {
    health.status = 'error';
  }

  res.json(health);
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'DealGuard API - Contract Intelligence Platform' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
