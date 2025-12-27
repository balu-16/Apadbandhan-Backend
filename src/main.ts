import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';

// Create Express instance for Vercel serverless
const server = express();

// Cache the app instance for serverless warm starts
let app: NestExpressApplication;

async function createNestServer(): Promise<NestExpressApplication> {
  if (app) {
    return app;
  }

  const expressAdapter = new ExpressAdapter(server);
  app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    expressAdapter,
    { logger: ['error', 'warn'] } // Reduced logging - only errors and warnings
  );

  // Disable ETag to prevent 304 Not Modified on dynamic API responses
  try {
    server.disable('etag');
  } catch {
    // ignore if method fails
  }

  // Force no-store caching for API endpoints
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
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing for images
  }));

  // Enable CORS
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, serverless, etc.)
      if (!origin) {
        callback(null, true);
      } else if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Be permissive in serverless
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

  // HTTP request logging - minimal format (method, url, status, response time)
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan(':method :url :status :response-time ms'));
  }

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
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

  await app.init();
  return app;
}

// For Vercel serverless - export the handler
export default async function handler(req: Request, res: Response) {
  await createNestServer();
  server(req, res);
}

// For local development
async function bootstrap() {
  await createNestServer();
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Apadbandhav API is running on: http://localhost:${port}/api`);
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  }
}

// Only run bootstrap in non-serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  bootstrap();
}
