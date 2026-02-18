import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { ValidationError } from '../utils/errors.js';

/**
 * File Service
 * Handles file uploads, validation, and storage
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

// Allowed file types
const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png'
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Validate file type
 * Requirement 15.1, 15.2: Only accept PDF, JPG, or PNG formats
 * @param {string} mimetype - File MIME type
 * @param {string} filename - Original filename
 * @returns {boolean} True if valid
 * @throws {ValidationError} If file type is invalid
 */
export function validateFileType(mimetype, filename) {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES[mimetype]) {
    throw new ValidationError('Invalid file format. Only PDF, JPG, and PNG files are allowed');
  }

  // Check file extension
  const ext = path.extname(filename).toLowerCase();
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  
  if (!allowedExtensions.includes(ext)) {
    throw new ValidationError('Invalid file extension. Only .pdf, .jpg, .jpeg, and .png files are allowed');
  }

  return true;
}

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @returns {boolean} True if valid
 * @throws {ValidationError} If file size exceeds limit
 */
export function validateFileSize(size) {
  if (size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  return true;
}

/**
 * Upload a file
 * Requirements: 15.1, 15.2, 15.3
 * @param {Object} file - File object from multer
 * @param {string} userId - User ID who is uploading
 * @returns {Promise<Object>} Upload result with file ID and URL
 * @throws {ValidationError} If file validation fails
 */
export async function uploadFile(file, userId) {
  if (!file) {
    throw new ValidationError('No file provided');
  }

  // Validate file type
  validateFileType(file.mimetype, file.originalname);

  // Validate file size
  validateFileSize(file.size);

  // Generate unique file ID
  const fileId = uuidv4();
  const ext = path.extname(file.originalname);
  const filename = `${fileId}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Save file to disk
  if (file.buffer) {
    // If file is in memory (from multer memoryStorage)
    fs.writeFileSync(filepath, file.buffer);
  } else if (file.path) {
    // If file is already saved (from multer diskStorage)
    fs.renameSync(file.path, filepath);
  } else {
    throw new ValidationError('Invalid file data');
  }

  // Generate file URL (relative path)
  const fileUrl = `/uploads/${filename}`;

  return {
    success: true,
    fileId,
    fileUrl,
    filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  };
}

/**
 * Get file URL by file ID
 * @param {string} fileId - File ID
 * @returns {string} File URL
 */
export function getFileUrl(fileId) {
  // In a real application, you might query a database to get the file path
  // For now, we'll construct the URL based on the file ID
  return `/uploads/${fileId}`;
}

/**
 * Delete a file
 * Requirement 15.5: Maintain file references for potential restoration
 * Note: This is a soft delete - we don't actually delete the file from disk
 * @param {string} fileId - File ID to delete
 * @returns {Promise<void>}
 */
export async function deleteFile(fileId) {
  // In a real application, you might mark the file as deleted in a database
  // rather than actually deleting it from disk
  // This allows for potential restoration as per Requirement 15.5
  
  // For now, we'll just log the deletion
  console.log(`File ${fileId} marked for deletion (soft delete)`);
  
  // Optionally, you could move the file to a "deleted" directory
  // or update a database record to mark it as deleted
}

/**
 * Permanently delete a file from disk
 * Use with caution - this is irreversible
 * @param {string} filename - Filename to delete
 * @returns {Promise<void>}
 */
export async function permanentlyDeleteFile(filename) {
  const filepath = path.join(UPLOAD_DIR, filename);
  
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}
