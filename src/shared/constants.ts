/**
 * Application Constants
 * 
 * Centralized constants to avoid magic numbers and hardcoded strings throughout the codebase.
 */

// ==================== DEVICE CONSTANTS ====================

/**
 * Length of device QR code
 */
export const DEVICE_CODE_LENGTH = 16;

/**
 * Device status values
 */
export const DEVICE_STATUS = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    MAINTENANCE: 'maintenance',
} as const;

/**
 * Device types
 */
export const DEVICE_TYPES = [
    'Vehicle',
    'Bike',
    'Car',
    'Truck',
    'Smart Helmet',
    'Wearable',
    'Other',
] as const;

// ==================== FILE UPLOAD CONSTANTS ====================

/**
 * Profile photo constraints
 */
export const PROFILE_PHOTO = {
    MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
};

/**
 * QR code image constraints
 */
export const QR_CODE_IMAGE = {
    MAX_SIZE_BYTES: 16 * 1024 * 1024, // 16MB
    ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/jpg'],
};

// ==================== BATCH LIMITS ====================

/**
 * Maximum batch size for bulk operations
 */
export const BATCH_LIMITS = {
    DEVICE_LOCATIONS: 100,
    QR_CODES: 100,
};

// ==================== OTP CONSTANTS ====================

/**
 * OTP configuration
 */
export const OTP_CONFIG = {
    LENGTH: 6,
    EXPIRY_MINUTES: 5,
};

// ==================== PAGINATION DEFAULTS ====================

/**
 * Default pagination values
 */
export const PAGINATION = {
    DEFAULT_LIMIT: 100,
    DEFAULT_SKIP: 0,
    MAX_LIMIT: 1000,
};

// ==================== SMS MESSAGE TEMPLATES ====================

/**
 * SMS message templates
 */
export const SMS_TEMPLATES = {
    OTP: (otp: string) =>
        `Welcome to Apadbandhav. Your OTP for authentication is ${otp}. Don't share with anybody. Thank you.`,
};
