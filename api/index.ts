import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';

const server = express();
let app: INestApplication;

async function bootstrap() {
    if (!app) {
        app = await NestFactory.create(
            AppModule,
            new ExpressAdapter(server),
        );

        // Enable CORS
        app.enableCors({
            origin: process.env.CORS_ORIGINS?.split(',') || '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
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

        await app.init();
    }
    return app;
}

// Vercel serverless handler
export default async (req: Request, res: Response) => {
    await bootstrap();
    server(req, res);
};
