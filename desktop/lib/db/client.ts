import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!env.DATABASE_URL) {
    return null;
  }
  if (!dbInstance) {
    const sql = postgres(env.DATABASE_URL, { prepare: false });
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

export type DbClient = NonNullable<ReturnType<typeof getDb>>;
