# VYB

Desktop-first social platform (Next.js + Tauri). All application code lives in `desktop/`.

## Quick start

```bash
cd desktop
npm install
cp .env.example .env.local
npm run verify:env
npm run db:migrate
npm run db:seed
npm run dev
```

Desktop shell: `npm run dev:desktop`

Full setup: [desktop/docs/SETUP.md](desktop/docs/SETUP.md)  
Database (Docker / Neon / Supabase): [desktop/docs/DATABASE.md](desktop/docs/DATABASE.md)

## Repo layout

- `desktop/` — Next.js app, Tauri shell, Drizzle schema, APIs
- `desktop/docs/` — architecture, threat model, setup
- `desktop/supabase/rls.sql` — optional Realtime RLS policies
