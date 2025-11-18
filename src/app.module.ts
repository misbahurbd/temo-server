import { Module } from '@nestjs/common';
// import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './infrastructure/redis/redis.module';
import { validateEnv } from './validations/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    RedisModule,
  ],
})
export class AppModule {}
