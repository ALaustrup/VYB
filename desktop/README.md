# Vyb Desktop

Desktop-first Vyb platform foundation built with Next.js + Tauri for Linux, macOS, and Windows.

## Stack

- Next.js App Router + TypeScript strict
- Tauri v2 desktop shell
- Tailwind + Framer Motion + Zustand + TanStack Query
- Zod env validation
- Vitest + Playwright test scaffolding

## Run locally

```bash
npm install
cp .env.example .env.local
npm run verify:env
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000` for web UI preview.

## Run as desktop app

```bash
npm run dev:desktop
```

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Database workflow (Drizzle)

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Build desktop installers

```bash
npm run build:desktop
```

## Required environment

Copy `.env.example` to `.env.local` and provide values:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `CLERK_WEBHOOK_SECRET`

## Docs

- `docs/SETUP.md` — env, migrate, Clerk webhook, Vercel preview
- `docs/architecture.md`
- `docs/threat-model.md`
- `docs/decision-log.md`
- `docs/prompts/vyb-unified-master-prompt.md`
