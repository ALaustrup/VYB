# Vyb setup (Lane A)

## 1. Environment

```bash
cd desktop
cp .env.example .env.local
npm run verify:env
```

Required: `DATABASE_URL`.

Recommended: Clerk publishable + secret keys, Clerk webhook secret, Supabase URL/anon key (chat Realtime), Upstash Redis (rate limits).

## 2. Database

See [DATABASE.md](./DATABASE.md) for **Neon** (cloud) or Docker (local).

**Local Postgres (Docker):**

```bash
npm run db:up      # starts postgres on localhost:5432 (vyb/vyb/vyb)
npm run db:migrate
npm run db:seed
# or: npm run db:setup
```

Set `DATABASE_URL=postgresql://vyb:vyb@localhost:5432/vyb` in `.env.local` (default in template after `cp .env.example`).

## 3. Clerk

Add to `.env.local`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

**Local dev without webhooks:** the app calls `ensureCurrentUserSynced()` on protected APIs, so sign-in + first feed/onboarding request creates your row in Postgres.

**Production / optional local webhooks:** Clerk Dashboard → Webhooks → endpoint:

`https://<your-host>/api/webhooks/clerk`

Events: `user.created`, `user.updated`. Copy the signing secret to `CLERK_WEBHOOK_SECRET`.

For localhost webhooks, use [ngrok](https://ngrok.com) or Clerk’s tunnel, e.g. `ngrok http 3000` and use the HTTPS URL above.

## 4. Local run

```bash
npm run dev          # web at http://localhost:3000
npm run dev:desktop  # Tauri shell
```

## 5. Supabase Realtime (optional)

1. Enable replication for `messages` in Supabase.
2. Run `supabase/rls.sql` in the SQL editor (adjust `auth.uid()` mapping if you sync Clerk → Supabase users).
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 6. Preview deploy (Vercel)

Root directory: `desktop`. Framework: Next.js. Add the same env vars as `.env.local`.

```bash
cd desktop
npx vercel
```

## Smoke checklist

- [ ] Sign up / sign in
- [ ] Onboarding completes
- [ ] Feed loads posts
- [ ] Profile, follow, message
- [ ] Comment on a post → notification
- [ ] Chat send/receive
- [ ] Create event + RSVP on detail page
- [ ] Report/block APIs respond
