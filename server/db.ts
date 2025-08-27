import "dotenv/config";
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to set it in .env?",
  );
}

export const pool = await mysql.createPool(process.env.DATABASE_URL);
export const db = drizzle(pool, { schema, mode: 'default' });