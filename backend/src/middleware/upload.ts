import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { translateMulterError, FileUploadError } from '../utils/errors.js';

// Enforce 100% memory storage: files are stored only in memory buffers during processing
const memoryStorage = multer.memoryStorage();

/**
 * Standard upload middleware for verification documents and images.
 * Limit: 5 MB per file.
 */
export const uploadMemoryDocument = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new FileUploadError(
          'Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are supported.',
          'UNSUPPORTED_FILE_TYPE',
          file.fieldname || 'file'
        )
      );
    }
  },
});

/**
 * Image-only upload middleware (for avatars, product listings, delivery proofs).
 * Limit: 5 MB per file.
 */
export const uploadMemoryImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new FileUploadError(
          'Invalid file type. Only JPEG, PNG, and WebP images are supported.',
          'UNSUPPORTED_FILE_TYPE',
          file.fieldname || 'image'
        )
      );
    }
  },
});

/**
 * Helper middleware that intercepts Multer errors and passes standard FileUploadErrors.
 */
export function handleSingleUpload(fieldName = 'file', uploader = uploadMemoryDocument) {
  return (req: Request, res: Response, next: NextFunction) => {
    uploader.single(fieldName)(req, res, (err: any) => {
      if (err) {
        if (err.name === 'MulterError') {
          return next(translateMulterError(err));
        }
        return next(err);
      }
      next();
    });
  };
}

