import { ValidationError } from './errors.js';

export const validateRequired = (fields, data) => {
  const missing = [];
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
};

export const validateEducationLevel = (level) => {
  const validLevels = ['junior_high', 'senior_high', 'university'];
  if (!validLevels.includes(level)) {
    throw new ValidationError(`Invalid education level. Must be one of: ${validLevels.join(', ')}`);
  }
};

export const validateRole = (role) => {
  const validRoles = ['member', 'moderator', 'admin'];
  if (!validRoles.includes(role)) {
    throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
};

export const validateFileType = (mimetype) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (!validTypes.includes(mimetype)) {
    throw new ValidationError('Invalid file type. Only JPG, PNG, and PDF files are allowed');
  }
};

export const validateBioLength = (bio) => {
  if (bio && bio.length > 512) {
    throw new ValidationError('Bio must not exceed 512 characters');
  }
};

export const validateProfilePictureFormat = (url) => {
  if (!url) return; // Allow empty/null values
  
  // Check if URL ends with .jpg, .jpeg, or .png (case insensitive)
  const validExtensions = ['.jpg', '.jpeg', '.png'];
  const lowerUrl = url.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => lowerUrl.endsWith(ext));
  
  if (!hasValidExtension) {
    throw new ValidationError('Profile picture must be in JPG or PNG format');
  }
};
