import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database features will not work.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy" });
export const db = drizzle(pool, { schema });
