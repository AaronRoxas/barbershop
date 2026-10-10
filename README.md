# Barbershop Booking Platform

Reusable, multi-tenant appointment booking for barbershops. See `docs/PROJECT_SPEC.md` and `docs/ARCHITECTURE.md`.

## Current phase

Phase 5 adds protected shop administration: appointments, services, barbers, availability,
shop details and marketing image uploads, alongside guest booking and the public website.
See [Supabase setup](docs/SUPABASE_SETUP.md) for local startup, database checks, and hosted configuration.
See [public website](docs/PUBLIC_WEBSITE.md) for content configuration and browser checks.
See [booking](docs/BOOKING.md) for scheduling rules, privacy, migration setup, and verification.
See [admin dashboard](docs/ADMIN.md) for account setup, permissions and management workflows.
Next: Phase 6, notifications.

## Setup

Start Docker Desktop, then run:

```bash
npm ci
npm run db:start
npm run db:env
```

`db:env` creates `.env.local` if it does not exist. To intentionally switch an existing file to local
Supabase, use `npm run db:env -- --use-local`. For a hosted project, copy `.env.example`
and supply matching project credentials instead. Missing configuration shows an unavailable-shop page.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run lint` — ESLint
- `npm run build` — production build
- `npm run test:e2e` — local production build and desktop/mobile browser checks
- `npm run db:test:booking` — local scheduling, validation, retry, and concurrency checks
- `npm run db:test:admin` — local role, scheduling, snapshot, status and concurrent-edit checks
- `npm run admin:local -- --email owner@example.com` — create a local owner with a masked password prompt
