import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import serverless from 'serverless-http';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Cache the serverless handler
let cachedHandler: any;

async function bootstrap() {
    const expressApp = express();
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
    );

    // Enable CORS
    app.enableCors({
        origin: ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080', 'https://apadbandhav-frontend.vercel.app', 'https://apadbandhan-backend.vercel.app'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // API prefix
    app.setGlobalPrefix('api');

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('Apadbandhav API')
        .setDescription('AIoT Accident Detection and Emergency Response API')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management endpoints')
        .addTag('devices', 'Device management endpoints')
        .addTag('alerts', 'Alert management endpoints')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    return serverless(expressApp);
}

export const handler = async (event: any, context: any) => {
    if (!cachedHandler) {
        cachedHandler = await bootstrap();
    }
    return cachedHandler(event, context);
};
