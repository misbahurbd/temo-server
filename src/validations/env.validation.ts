import { z } from 'zod';

export const booleanFromEnv = z
  .preprocess((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      if (value === 'true') {
        return true;
      }
      if (value === 'false') {
        return false;
      }
    }

    return value;
  }, z.boolean())
  .default(false);

export const envValidationSchema = z
  .object({
    // Application Configuration
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    // CORS Configuration
    CLIENT_ORIGIN: z.url().optional(),
    // Database Configuration
    DATABASE_URL: z.url(),
    // Redis Configuration
    REDIS_URL: z.url().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().int().min(0).default(0),
    REDIS_TLS: booleanFromEnv,
    // Session Configuration
    SESSION_SECRET: z.string().min(32),
    SESSION_TTL: z.coerce.number().int().min(300),
    SESSION_NAME: z.string(),
    SESSION_ROLLING: booleanFromEnv.default(false),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.CLIENT_ORIGIN) {
      ctx.addIssue({
        code: 'custom',
        message: 'CLIENT_ORIGIN is required when NODE_ENV is production',
        path: ['CLIENT_ORIGIN'],
      });
    }

    const hasRedisUrl = Boolean(env.REDIS_URL);
    const hasRedisHost = Boolean(env.REDIS_HOST);

    if (hasRedisUrl === hasRedisHost) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide either REDIS_URL or REDIS_HOST',
        path: hasRedisUrl ? ['REDIS_HOST'] : ['REDIS_URL'],
      });
    }

    if (env.SESSION_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        message: 'SESSION_SECRET must be at least 32 characters long',
        path: ['SESSION_SECRET'],
      });
    }
  });

export type EnvVariables = z.infer<typeof envValidationSchema>;

export const validateEnv = (config: Record<string, unknown>): EnvVariables => {
  const result = envValidationSchema.safeParse(config);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation error:\n${details}`);
  }

  return result.data;
};
