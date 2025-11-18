import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './bootstrap/swagger.bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  setupSwagger(app, configService);

  const port = configService.get<number>('PORT', 3002);
  await app.listen(port);
  logger.log(`Server is running on port ${port}`);
}
void bootstrap();
