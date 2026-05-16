import "../lib/bootstrap-env";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

async function main() {
  const sql = postgres(url, { max: 1 });
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✓ pgvector extension enabled");
  await sql.end({ timeout: 2 });
}

void main();
