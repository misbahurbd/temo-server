import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVariables } from 'src/validations/env.validation';
import { createClient, RedisClientOptions, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService<EnvVariables>) {}

  async onModuleInit() {
    try {
      const options = this.getRedisOptions();
      console.log(options);
      this.client = createClient(options) as RedisClientType;

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error', err);
      });

      this.client.on('connect', () => {
        this.logger.log('Redis Client connecting...');
      });

      this.client.on('ready', () => {
        this.logger.log('Redis Client ready');
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis Client reconnecting...');
      });

      await this.client.connect();
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.error(
        'Failed to connect to Redis',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.client && this.client.isOpen) {
        await this.client.quit();
        this.logger.log('Redis disconnected successfully');
      }
    } catch (error) {
      this.logger.error(
        'Error disconnecting from Redis',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isConnected(): boolean {
    return this.client?.isOpen ?? false;
  }

  private getReconnectStrategy() {
    return (retries: number): number | Error => {
      if (retries > 10) {
        this.logger.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed after 10 retries');
      }
      const delay = Math.min(retries * 30, 1000); // Faster retry: max 1s delay
      return delay;
    };
  }

  private getRedisOptions(): RedisClientOptions {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisUsername = this.configService.get<string>('REDIS_USERNAME');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
    const redisDb = this.configService.get<number>('REDIS_DB', 0);
    const enableTls = this.configService.get<boolean>('REDIS_TLS', false);
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    const baseOptions: RedisClientOptions = {
      socket: {
        reconnectStrategy: this.getReconnectStrategy(),
      },
    };

    if (enableTls) {
      baseOptions.socket = {
        ...baseOptions.socket,
        tls: true,
        rejectUnauthorized: isProduction,
      };
    }

    if (redisUrl) {
      baseOptions.url = redisUrl;
      return baseOptions;
    }

    if (!redisHost) {
      throw new Error('REDIS_HOST must be defined when REDIS_URL is not set');
    }

    return {
      ...baseOptions,
      socket: {
        ...baseOptions.socket,
        host: redisHost,
        port: redisPort,
      },
      username: redisUsername,
      password: redisPassword,
      database: redisDb,
    };
  }
}
