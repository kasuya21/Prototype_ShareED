import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from './config/config.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import './database/db.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontend.url,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

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
import userRoutes from './routes/userRoutes.js';
import followRoutes from './routes/followRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import postRoutes from './routes/postRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import questRoutes from './routes/questRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Knowledge Sharing Platform API' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Follow routes
app.use('/api/users', followRoutes);

// Post routes
app.use('/api/posts', postRoutes);

// Report routes (for post reporting)
app.use('/api/posts', reportRoutes);

// Moderation routes
app.use('/api/moderation', reportRoutes);

// Interaction routes (likes, comments, bookmarks)
app.use('/api/posts', interactionRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Shop routes
app.use('/api/shop', shopRoutes);

// Shop inventory routes (under users)
app.use('/api/users', shopRoutes);

// Quest routes
app.use('/api/quests', questRoutes);

// Achievement routes
app.use('/api/achievements', achievementRoutes);

// User achievement routes
app.use('/api/users', achievementRoutes);

// File upload routes
app.use('/api/files', fileRoutes);

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

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

export default app;
