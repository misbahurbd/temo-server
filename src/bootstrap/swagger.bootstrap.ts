import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export const setupSwagger = (
  app: INestApplication,
  configService: ConfigService,
) => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const sessionName = configService.get<string>('SESSION_NAME', 'temo.sid');

  // Only enable Swagger in non-production environments
  if (nodeEnv === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Temo API')
    .setDescription('Temo API documentation')
    .setVersion('1.0')
    .addCookieAuth(sessionName, {
      type: 'apiKey',
      in: 'cookie',
      name: sessionName,
      description: 'Session ID cookie for authentication',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
};
