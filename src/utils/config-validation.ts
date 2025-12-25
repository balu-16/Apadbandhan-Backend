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
    defaultValue: 'http://localhost:8080,http://localhost:3000,http://127.0.0.1:8080',
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

export function validateEnvironmentVariables(): void {
  const logger = new Logger('ConfigValidation');
  const errors: string[] = [];
  const warnings: string[] = [];

  logger.log('🔍 Validating environment variables...');

  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key];

    if (config.required && !value) {
      errors.push(`❌ Missing required environment variable: ${key} - ${config.description}`);
    } else if (!value && config.defaultValue) {
      process.env[key] = config.defaultValue;
      logger.warn(`⚠️  Using default value for ${key}: ${config.defaultValue}`);
    } else if (!value) {
      warnings.push(`⚠️  Optional environment variable not set: ${key} - ${config.description}`);
    }
  });

  // Additional validations
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('❌ JWT_SECRET must be at least 32 characters long for security');
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin === '*') {
      warnings.push('⚠️  CORS_ORIGIN is set to "*" in production - consider using specific domains');
    }

    // Check SMS configuration for production
    const smsVars = ['SMS_SECRET', 'SMS_SENDER', 'SMS_TEMPID', 'SMS_BASE_URL'];
    const missingSmsVars = smsVars.filter(v => !process.env[v]);
    if (missingSmsVars.length > 0) {
      warnings.push(`⚠️  SMS configuration incomplete (${missingSmsVars.join(', ')}) - OTP functionality may not work`);
    }
  }

  // Log warnings
  warnings.forEach(warning => logger.warn(warning));

  // Handle errors
  if (errors.length > 0) {
    logger.error('❌ Environment validation failed:');
    errors.forEach(error => logger.error(error));
    logger.error('💡 Please check your .env file and ensure all required variables are set');
    process.exit(1);
  }

  logger.log('✅ Environment validation passed');
}

