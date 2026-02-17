import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from './config/config.js';
import './database/db.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontend.url,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
import authRoutes from './routes/authRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import postRoutes from './routes/postRoutes.js';

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Knowledge Sharing Platform API' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Post routes
app.use('/api/posts', postRoutes);

// Interaction routes (likes, comments, bookmarks)
app.use('/api/posts', interactionRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(config.nodeEnv === 'development' && { details: err.details })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
