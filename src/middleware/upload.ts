import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/ApiError';

// Configuration from environment
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');

/**
 * File filter to validate file types
 */
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
): void => {
    // Check if file type is allowed
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new ApiError(
                400,
                `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
            )
        );
    }
};

/**
 * Multer configuration for file uploads
 * Stores files in memory as Buffer
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
});

/**
 * Middleware for single file upload
 * Usage: upload.single('fieldName')
 */
export const uploadSingle = upload.single('file');

/**
 * Middleware for multiple files upload
 * Usage: upload.array('images', 10)
 */
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => {
    return upload.array(fieldName, maxCount);
};

/**
 * Middleware for multiple fields
 * Usage: uploadFields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 5 }])
 */
export const uploadFields = (fields: { name: string; maxCount: number }[]) => {
    return upload.fields(fields);
};

export default upload;