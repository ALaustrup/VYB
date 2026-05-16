import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = ["DATABASE_URL", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"] as const;

const recommended = [
  "CLERK_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    console.error("Missing .env.local — copy .env.example to .env.local first.");
    process.exit(1);
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function main() {
  loadEnvLocal();

  let failed = false;
  for (const key of required) {
    if (!process.env[key]?.trim()) {
      console.error(`✗ Missing required: ${key}`);
      failed = true;
    } else {
      console.log(`✓ ${key}`);
    }
  }
  for (const key of recommended) {
    if (!process.env[key]?.trim()) {
      console.warn(`○ Recommended not set: ${key}`);
    } else {
      console.log(`✓ ${key}`);
    }
  }

  if (failed) process.exit(1);
  console.log("\nEnvironment looks ready for npm run db:migrate and npm run dev:desktop.");
}

main();
