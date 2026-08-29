import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const isLocalhost =
  databaseUrl.includes("127.0.0.1") || databaseUrl.includes("localhost");

// پیکربندی اتصال مقاوم برای استقرار روی ورسل (Vercel Serverless) و سرویس‌های ابری
const poolConfig = {
  connectionString: databaseUrl,
  max: process.env.NODE_ENV === "production" ? 10 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
  // در سرورهای ابری و پروداکشن ورسل در صورت نیاز SSL فعال می‌شود
  ssl:
    !isLocalhost && process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
};

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });
export * from "./schema";
