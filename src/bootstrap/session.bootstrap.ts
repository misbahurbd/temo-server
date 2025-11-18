import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { RedisService } from 'src/infrastructure/redis/redis.service';

export const configureSession = (
  app: INestApplication,
  configService: ConfigService,
  redisService: RedisService,
): void => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const redisClient = redisService.getClient();

  // session configuration
  const sessionSecret = configService.getOrThrow<string>('SESSION_SECRET');
  const sessionTtl = configService.getOrThrow<number>('SESSION_TTL');
  const sessionName = configService.getOrThrow<string>('SESSION_NAME');
  const sessionRolling = configService.get<boolean>('SESSION_ROLLING', false);

  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
        prefix: 'auth:',
        ttl: sessionTtl,
      }),
      name: sessionName,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: sessionRolling,
      proxy: isProduction,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: sessionTtl * 1000,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/',
      },
    }),
  );
};
