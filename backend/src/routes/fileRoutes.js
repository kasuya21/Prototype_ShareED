import express from 'express';
import multer from 'multer';
import { uploadFile } from '../services/fileService.js';
import { authenticate } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/files/upload
 * Upload a file
 * Requirements: 15.1, 15.2, 15.3
 */
router.post('/upload', uploadLimiter, authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file provided'
        }
      });
    }

    const result = await uploadFile(req.file, req.user.id);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        fileId: result.fileId,
        fileUrl: result.fileUrl,
        filename: result.filename,
        originalName: result.originalName,
        mimetype: result.mimetype,
        size: result.size
      }
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum limit of 10MB'
          }
        });
      }

      return res.status(400).json({
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to upload file'
      }
    });
  }
});

export default router;
