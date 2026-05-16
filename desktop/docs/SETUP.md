# Vyb setup (Lane A)

## 1. Environment

```bash
cd desktop
cp .env.example .env.local
npm run verify:env
```

Required: `DATABASE_URL`, Clerk publishable + secret keys.

Recommended: Clerk webhook secret, Supabase URL/anon key (chat Realtime), Upstash Redis (rate limits).

## 2. Database

**Local Postgres (Docker):**

```bash
npm run db:up      # starts postgres on localhost:5432 (vyb/vyb/vyb)
npm run db:migrate
npm run db:seed
# or: npm run db:setup
```

Set `DATABASE_URL=postgresql://vyb:vyb@localhost:5432/vyb` in `.env.local` (default in template after `cp .env.example`).

## 3. Clerk webhook

In Clerk Dashboard → Webhooks, point to:

`https://<your-host>/api/webhooks/clerk`

Events: `user.created`, `user.updated`, `user.deleted`. Set `CLERK_WEBHOOK_SECRET` in `.env.local`.

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
