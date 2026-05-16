import { defineConfig } from "drizzle-kit";

import { loadEnvLocal } from "./lib/load-env-local";

loadEnvLocal();

export default defineConfig({
  out: "./lib/db/migrations",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
