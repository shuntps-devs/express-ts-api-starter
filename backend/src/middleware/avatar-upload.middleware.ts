import path from 'path';

import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';

import { logger } from '../config';
import { t } from '../i18n';
import { AvatarService } from '../services';
import { ErrorHelper } from '../utils';

import { asyncHandler } from './async-handler';

/**
 * Extended request interface with file buffer
 */
export interface IAvatarUploadRequest extends Request {
  fileBuffer?: {
    buffer: Buffer;
    originalName: string;
    mimetype: string;
    size: number;
  };
}

/**
 * Avatar upload configuration
 */
const AVATAR_UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  imageProcessing: {
    width: 400,
    height: 400,
    quality: 90,
  },
};

/**
 * Multer configuration for avatar upload
 * Stores files in memory for processing before saving to disk
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: AVATAR_UPLOAD_CONFIG.maxFileSize,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const contextLogger = (req as Request).logger ?? logger;


    if (!AVATAR_UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      contextLogger.warn('Avatar upload rejected - invalid file type', {
        userId: (req as Request).user?._id,
        mimetype: file.mimetype,
        originalName: file.originalname,
      });

      return cb(
        ErrorHelper.createOperationalError(
          t('avatar.invalidFormat'),
          400,
          'INVALID_FILE_FORMAT'
        )
      );
    }


    const extension = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    if (!validExtensions.includes(extension)) {
      contextLogger.warn('Avatar upload rejected - invalid file extension', {
        userId: (req as Request).user?._id,
        extension,
        originalName: file.originalname,
      });

      return cb(
        ErrorHelper.createOperationalError(
          t('avatar.invalidFormat'),
          400,
          'INVALID_FILE_FORMAT'
        )
      );
    }

    cb(null, true);
  },
});

/**
 * Middleware to handle single avatar file upload
 * Uses multer to process multipart/form-data with single 'avatar' field
 */
export const uploadAvatar = upload.single('avatar');

/**
 * Process uploaded avatar image
 * Resizes, optimizes, and converts image using Sharp
 * @param req - Express request object with file data
 * @param res - Express response object
 * @param next - Express next function
 */
export const processAvatarImage = asyncHandler(
  async (req: IAvatarUploadRequest, res: Response, next: NextFunction) => {
    const contextLogger = req.logger ?? logger;

    if (!req.file) {
      contextLogger.warn('Avatar processing failed - no file uploaded', {
        userId: req.user?._id,
      });

      return ErrorHelper.sendError(
        res,
        t('avatar.uploadFailed'),
        400,
        'NO_FILE_UPLOADED'
      );
    }

    try {
      const { buffer, originalname, mimetype, size } = req.file;

      contextLogger.info('Processing avatar image', {
        userId: req.user?._id,
        originalName: originalname,
        mimetype,
        originalSize: size,
        targetDimensions: AVATAR_UPLOAD_CONFIG.imageProcessing,
      });


      const processedBuffer = await sharp(buffer)
        .resize(
          AVATAR_UPLOAD_CONFIG.imageProcessing.width,
          AVATAR_UPLOAD_CONFIG.imageProcessing.height,
          {
            fit: 'cover',
            position: 'center',
          }
        )
        .jpeg({ quality: AVATAR_UPLOAD_CONFIG.imageProcessing.quality })
        .toBuffer();


      const baseName = path.parse(originalname).name;
      const processedFilename = `${baseName}.jpg`;


      req.fileBuffer = {
        buffer: processedBuffer,
        originalName: processedFilename,
        mimetype: 'image/jpeg',
        size: processedBuffer.length,
      };

      contextLogger.info('Avatar image processed successfully', {
        userId: req.user?._id,
        processedFilename,
        originalSize: size,
        processedSize: processedBuffer.length,
        compressionRatio: `${(((size - processedBuffer.length) / size) * 100).toFixed(1)}%`,
      });

      next();
    } catch (error) {
      contextLogger.error('Avatar image processing failed', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return ErrorHelper.sendError(
        res,
        t('avatar.uploadFailed'),
        500,
        'IMAGE_PROCESSING_FAILED'
      );
    }
  }
);

/**
 * Validate avatar upload requirements
 * Ensures user is authenticated and file meets requirements
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateAvatarUpload = (
  req: IAvatarUploadRequest,
  res: Response,
  next: NextFunction
): void => {
  const contextLogger = req.logger ?? logger;


  if (!req.user?._id) {
    contextLogger.warn(
      'Avatar upload validation failed - user not authenticated'
    );

    return ErrorHelper.sendUnauthorized(res, t('auth.authenticationRequired'));
  }


  if (!req.fileBuffer) {
    contextLogger.warn('Avatar upload validation failed - no processed file', {
      userId: req.user._id,
    });

    return ErrorHelper.sendError(
      res,
      t('avatar.uploadFailed'),
      400,
      'NO_PROCESSED_FILE'
    );
  }


  if (!AvatarService.isValidSize(req.fileBuffer.size)) {
    contextLogger.warn(
      'Avatar upload validation failed - processed file too large',
      {
        userId: req.user._id,
        fileSize: req.fileBuffer.size,
        maxSize: AVATAR_UPLOAD_CONFIG.maxFileSize,
      }
    );

    return ErrorHelper.sendError(
      res,
      t('avatar.fileTooLarge'),
      400,
      'FILE_TOO_LARGE'
    );
  }

  contextLogger.debug('Avatar upload validation passed', {
    userId: req.user._id,
    processedFileSize: req.fileBuffer.size,
    filename: req.fileBuffer.originalName,
  });

  next();
};

/**
 * Handle multer upload errors
 * Provides specific error handling for common multer errors
 * @param error - Multer error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const handleAvatarUploadError = (
  error: Error | multer.MulterError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contextLogger = req.logger ?? logger;

  if (!error) {
    return next();
  }

  contextLogger.warn('Avatar upload error occurred', {
    userId: req.user?._id,
    errorCode: 'code' in error ? error.code : undefined,
    error: error.message,
  });


  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return ErrorHelper.sendError(
          res,
          t('avatar.fileTooLarge'),
          400,
          'FILE_TOO_LARGE'
        );

      case 'LIMIT_FILE_COUNT':
        return ErrorHelper.sendError(
          res,
          'Only one avatar file allowed',
          400,
          'TOO_MANY_FILES'
        );

      case 'LIMIT_UNEXPECTED_FILE':
        return ErrorHelper.sendError(
          res,
          'Unexpected file field. Use "avatar" field name',
          400,
          'UNEXPECTED_FILE_FIELD'
        );

      default:
        return ErrorHelper.sendError(
          res,
          t('avatar.uploadFailed'),
          400,
          'UPLOAD_ERROR'
        );
    }
  }


  if (ErrorHelper.isOperational(error)) {
    const operationalError = error as Error & { statusCode?: number };
    return ErrorHelper.sendError(
      res,
      operationalError.message,
      operationalError.statusCode ?? 400
    );
  }


  contextLogger.error('Unexpected avatar upload error', {
    userId: req.user?._id,
    error: error.message ?? 'Unknown error',
    stack: error.stack,
  });

  return ErrorHelper.sendError(
    res,
    t('avatar.uploadFailed'),
    500,
    'UNEXPECTED_UPLOAD_ERROR'
  );
};

/**
 * Get avatar upload configuration and limits
 * Returns current upload limits for client-side validation
 * @returns Upload configuration object
 */
export const getAvatarUploadConfig = () => ({
  maxFileSize: AVATAR_UPLOAD_CONFIG.maxFileSize,
  maxFileSizeMB: Math.round(AVATAR_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)),
  allowedMimeTypes: AVATAR_UPLOAD_CONFIG.allowedMimeTypes,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  imageProcessing: AVATAR_UPLOAD_CONFIG.imageProcessing,
});
