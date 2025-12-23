import { memoryStorage } from 'multer';

/**
 * Shared Multer Configuration
 * 
 * Centralized multer configuration for file uploads across the application.
 * This eliminates duplicate configuration in controllers.
 */

/**
 * Configuration for profile photo uploads
 * - Max file size: 5MB
 * - Allowed types: JPEG, PNG, GIF, WebP
 */
export const profilePhotoMulterConfig = {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req: any, file: any, callback: any) => {
        if (file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
            callback(null, true);
        } else {
            callback(new Error('Only image files are allowed'), false);
        }
    },
};

/**
 * Configuration for QR code image uploads
 * - Max file size: 16MB
 * - Allowed types: PNG, JPEG
 */
export const qrCodeMulterConfig = {
    storage: memoryStorage(),
    limits: {
        fileSize: 16 * 1024 * 1024, // 16MB max
    },
    fileFilter: (req: any, file: any, callback: any) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error('Only PNG and JPEG images are allowed'), false);
        }
    },
};
