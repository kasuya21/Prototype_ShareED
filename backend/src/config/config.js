import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH || './data/database.sqlite',
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/callback'
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) // 5MB default
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173'
  }
};
