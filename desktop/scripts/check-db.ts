import "../lib/bootstrap-env";
import postgres from "postgres";

const rawUrl = process.env.DATABASE_URL?.trim();
if (!rawUrl) {
  console.error("✗ DATABASE_URL is not set in .env.local");
  process.exit(1);
}
const url: string = rawUrl;

async function main() {
  const sql = postgres(url, { max: 1, connect_timeout: 5 });
  try {
    await sql`select 1 as ok`;
    console.log("✓ Database reachable:", url.replace(/:[^:@]+@/, ":****@"));
  } catch (err) {
    console.error("✗ Cannot connect to Postgres.");
    console.error(err instanceof Error ? err.message : err);
    console.error("\nOptions:");
    console.error("  1. Install Docker Desktop, then: npm run db:up");
    console.error("  2. Use a free Neon/Supabase URL in .env.local (see docs/DATABASE.md)");
    process.exit(1);
  } finally {
    await sql.end({ timeout: 2 });
  }
}

void main();
