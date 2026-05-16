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

## Option B — Neon (free cloud, no Docker)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **connection string** (pooled or direct).
3. Paste into `.env.local`:

   `DATABASE_URL=postgresql://...`

4. Run:

   ```bash
   npm run db:check
   npm run db:migrate
   npm run db:seed
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
