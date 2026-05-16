import "../lib/bootstrap-env";
import postgres from "postgres";

const rawUrl = process.env.DATABASE_URL?.trim();
if (!rawUrl) throw new Error("DATABASE_URL missing");
const url: string = rawUrl;

async function main() {
  const sql = postgres(url, { max: 1 });
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1
  `;
  console.log("public tables:", tables.map((t) => t.tablename));
  const migrations = await sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`;
  console.log("applied migrations:", migrations);
  await sql.end({ timeout: 2 });
}

void main();
