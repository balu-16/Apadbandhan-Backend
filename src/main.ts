import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import morgan from 'morgan';
import helmet from 'helmet';
import { validateEnvironmentVariables } from './utils/config-validation';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  // Validate environment variables before starting the application
  validateEnvironmentVariables();
  const app = await NestFactory.create(AppModule);

  // Disable ETag to prevent 304 Not Modified on dynamic API responses
  try {
    const expressApp = (app as any).getHttpAdapter?.().getInstance?.();
    expressApp?.disable?.('etag');
  } catch {
    // ignore if adapter methods differ
  }

  // Force no-store caching for API endpoints to avoid stale 304 behavior on clients
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Security headers with Helmet.js
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for mobile app compatibility
  }));

  // Enable CORS with security
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080'];
    
  // In production, don't allow wildcard origins
  const isProduction = process.env.NODE_ENV === 'production';
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) only in development
      if (!origin && !isProduction) {
        callback(null, true);
      } else if (origin && (allowedOrigins.includes(origin) || (!isProduction && allowedOrigins.includes('*')))) {
        callback(null, true);
      } else if (!origin && isProduction) {
        // Allow requests without origin in production for mobile apps
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-device-api-key'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // HTTP request logging
  app.use(morgan('combined'));

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation (only in non-production or if explicitly enabled)
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Apadbandhav API')
      .setDescription('AIoT Accident Detection and Emergency Response API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('devices', 'Device management endpoints')
      .addTag('alerts', 'Alert management endpoints')
      .addTag('device-locations', 'Device location tracking endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Apadbandhav API is running on: http://localhost:${port}/api`);
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
