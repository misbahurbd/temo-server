import 'dotenv/config';
import { join } from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: join('prisma'),
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
