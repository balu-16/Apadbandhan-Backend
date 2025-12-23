import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

const server = express();

export default server;

const bootstrap = async () => {
    const app = await NestFactory.create(
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
};

bootstrap();
