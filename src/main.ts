import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './bootstrap/swagger.bootstrap';
import { setupApp } from './bootstrap/app.bootstrap';
import { setupSecurity } from './bootstrap/security.bootstrap';
import { configureSession } from './bootstrap/session.bootstrap';
import { RedisService } from './infrastructure/redis/redis.service';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  const redisService = app.get(RedisService);

  // Setup base application
  setupApp(app, configService);

  // Setup security
  setupSecurity(app, configService);

  // Setup Swagger documentation
  setupSwagger(app, configService);

  // Setup session
  configureSession(app, configService, redisService);

  // Start the server
  const port = configService.get<number>('PORT', 3002);
  await app.listen(port);
  logger.log(
    `Server is running on port ${port} in ${configService.get<string>('NODE_ENV')} mode`,
  );
}
void bootstrap();
