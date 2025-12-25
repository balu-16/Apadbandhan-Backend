import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module';

const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'https://apadbandhav-frontend.vercel.app',
    process.env.FRONTEND_URL,
].filter(Boolean);

let server: express.Express | undefined;

async function bootstrap() {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.setGlobalPrefix('api');

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
    return expressApp;
}

export default async function handler(req: Request, res: Response) {
    if (!server) {
        server = await bootstrap();
    }

    return server(req, res);
}

