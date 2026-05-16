import "../lib/bootstrap-env";

const required = ["DATABASE_URL"] as const;

const recommended = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Missing .env.local — copy .env.example to .env.local and set DATABASE_URL.");
    process.exit(1);
  }

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
  const hasClerk =
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) &&
    Boolean(process.env.CLERK_SECRET_KEY?.trim());
  if (!hasClerk) {
    console.warn("\n○ Clerk keys unset — npm run dev still works via Clerk keyless mode.");
  }
  console.log("\nEnvironment looks ready for npm run db:migrate and npm run dev:desktop.");
}

main();
