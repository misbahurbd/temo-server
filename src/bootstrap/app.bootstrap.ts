import express from 'express';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import cookieParser from 'cookie-parser';

export const setupApp = (
  app: INestApplication,
  configService: ConfigService,
) => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Ensure providers receive shutdown signals for graceful cleanup
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  // Core middlewares
  app.use(cookieParser());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Enable class validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction,
    }),
  );

  // Versioning Configuration
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });
};
