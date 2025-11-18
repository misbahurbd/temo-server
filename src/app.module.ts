import { Module } from '@nestjs/common';
// import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './infrastructure/redis/redis.module';
import { validateEnv } from './validations/env.validation';
import { AuthModule } from './auth/auth.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    RedisModule,
    AuthModule,
  ],
})
export class AppModule {}
