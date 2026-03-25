import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'Gemini key is required'),
  OPENAI_API_KEY: z.string().optional(),
  LINKEDIN_ACCESS_TOKEN: z.string().min(1, 'LinkedIn token is required').optional(),
  DATABASE_URL: z.string().url('Must be a valid Postgres URL'),
  VECTOR_DB_URL: z.string().url('Must be a valid Vector DB URL').optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
