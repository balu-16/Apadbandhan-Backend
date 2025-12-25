import { Logger } from '@nestjs/common';

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    description: string;
    defaultValue?: string;
  };
}

const requiredEnvVars: RequiredEnvVars = {
  MONGODB_URI: {
    required: true,
    description: 'MongoDB connection URI',
  },
  JWT_SECRET: {
    required: true,
    description: 'JWT secret key (minimum 32 characters)',
  },
  NODE_ENV: {
    required: false,
    description: 'Node environment',
    defaultValue: 'development',
  },
  PORT: {
    required: false,
    description: 'Server port',
    defaultValue: '3000',
  },
  CORS_ORIGIN: {
    required: false,
    description: 'CORS allowed origins',
    defaultValue: '*',
  },
  SMS_SECRET: {
    required: false,
    description: 'SMS provider secret key (required for OTP functionality)',
  },
  SMS_SENDER: {
    required: false,
    description: 'SMS sender ID',
  },
  SMS_TEMPID: {
    required: false,
    description: 'SMS DLT template ID',
  },
  SMS_BASE_URL: {
    required: false,
    description: 'SMS API base URL',
  },
  OTP_EXPIRY_MINUTES: {
    required: false,
    description: 'OTP expiry time in minutes',
    defaultValue: '5',
  },
};

export function validateEnvironmentVariables(): { valid: boolean; errors: string[] } {
  const logger = new Logger('ConfigValidation');
  const errors: string[] = [];
  const warnings: string[] = [];

  logger.log('🔍 Validating environment variables...');

  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key];

    if (config.required && !value) {
      errors.push(`Missing required: ${key} - ${config.description}`);
    } else if (!value && config.defaultValue) {
      process.env[key] = config.defaultValue;
    } else if (!value) {
      warnings.push(`Optional not set: ${key}`);
    }
  });

  // Additional validations
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }

  // Log warnings (don't fail for warnings)
  warnings.forEach(warning => logger.warn(`⚠️  ${warning}`));

  // Log errors but don't exit (for serverless compatibility)
  if (errors.length > 0) {
    logger.error('❌ Environment validation issues:');
    errors.forEach(error => logger.error(`  - ${error}`));
    // Don't process.exit() in serverless - just return status
  } else {
    logger.log('✅ Environment validation passed');
  }

  return { valid: errors.length === 0, errors };
}
