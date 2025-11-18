import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export const setupSecurity = (
  app: INestApplication,
  configService: ConfigService,
) => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      noSniff: true,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  const allowedHeaders = new Set([
    'Content-Type',
    'Accept',
    'Accept-Language',
    'X-Requested-With',
  ]);
  const exposedHeaders = new Set(['Content-Type']);
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const origin = isProduction
    ? [configService.getOrThrow<string>('CLIENT_ORIGIN')]
    : true;
  const allowedHeadersArray = Array.from(allowedHeaders);
  const exposedHeadersArray = Array.from(exposedHeaders);

  app.enableCors({
    origin,
    methods,
    credentials: true,
    allowedHeaders: allowedHeadersArray,
    exposedHeaders: exposedHeadersArray,
  });
};
