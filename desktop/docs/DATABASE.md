# Database setup

Vyb uses **PostgreSQL** via Drizzle. Set `DATABASE_URL` in `desktop/.env.local`.

## Option A — Docker (recommended)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then:

```bash
cd desktop
npm run db:up
npm run db:check
npm run db:migrate
npm run db:seed
```

Default URL (already in `.env.local` template):

`postgresql://vyb:vyb@localhost:5432/vyb`

## Option B — Neon (free cloud, no Docker) ← you chose this

1. Sign up / sign in at [console.neon.tech](https://console.neon.tech).
2. **New project** → name it `vyb` (any region is fine).
3. On the project dashboard, click **Connect**.
4. Copy the **direct** connection string (not “Pooled”):
   - Host looks like `ep-xxxx.region.aws.neon.tech` (no `-pooler` in the name).
   - Ensure the string includes `?sslmode=require` (Neon adds this by default).
5. Paste into `desktop/.env.local`:

   ```env
   DATABASE_URL=postgresql://neondb_owner:****@ep-....aws.neon.tech/neondb?sslmode=require
   ```

6. Create a dedicated database (if `neondb` already has other tables):

   ```bash
   npx neonctl databases create --project-id <your-project-id> --name vyb
   ```

   Use the connection string with `/vyb` as the database name.

7. Enable pgvector (required for the `posts.embedding` column), then migrate:

   ```bash
   npx tsx scripts/db-enable-pgvector.ts
   npm run db:check
   npm run db:migrate
   npm run db:seed
   ```

**Why direct?** Drizzle migrations need a non-pooled connection. Your Next.js app can use the same URL for local dev, or the pooled URL later on Vercel if you prefer.

**CLI alternative** (after `npx neonctl auth`):

```bash
npx neonctl connection-string --project-id <id> --database-name neondb
```

## Option C — Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Settings → Database → **Connection string** (URI).
3. Use the **Session** or **Transaction** pooler URL as `DATABASE_URL`.
4. Run migrate + seed as above.

## Verify

```bash
npm run db:check    # TCP + auth test
npm run verify:env  # includes DATABASE_URL
```

Without a running database, the app still loads but APIs return fallback/empty data.
