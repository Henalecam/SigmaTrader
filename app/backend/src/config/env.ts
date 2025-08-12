import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

type RequiredEnv = {
  PORT: number;
  JWT_SECRET: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  ENCRYPTION_KEY: string; // 32 bytes base64 or hex for AES-256
};

function requireEnv(name: keyof RequiredEnv): string {
  const value = process.env[name as string];
  if (!value) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
}

export const env: RequiredEnv = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  REDIS_URL: requireEnv('REDIS_URL'),
  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),
};