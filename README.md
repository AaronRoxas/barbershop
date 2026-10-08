# Barbershop Booking Platform

Reusable, multi-tenant appointment booking for barbershops. See `docs/PROJECT_SPEC.md` and `docs/ARCHITECTURE.md`.

## Current phase

Phase 2 adds the multi-tenant database, RLS policies, scheduling model, booking conflict constraint,
image storage policies, typed Supabase clients, and local development setup.
See [Supabase setup](docs/SUPABASE_SETUP.md) for local startup, database checks, and hosted configuration.
The website, booking flow, and admin login are still placeholders for later phases.

## Setup

Start Docker Desktop, then run:

```bash
npm ci
npm run db:start
npm run db:env
```

`db:env` creates `.env.local` if it does not exist. For a hosted project, copy `.env.example`
and supply your project credentials instead. Public placeholders can still run without Supabase.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run lint` — ESLint
- `npm run build` — production build
