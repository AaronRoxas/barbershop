# Phase 2: Database and Supabase

The repository contains versioned migrations, development fixtures, database security tests,
generated TypeScript types, typed Supabase clients, and public catalog query helpers.
Public pages and Phase 4 guest booking are implemented; see `docs/PUBLIC_WEBSITE.md` and `docs/BOOKING.md`.

## Local development

Install Docker Desktop and start its Linux engine. Use the versions in `package-lock.json`:
The Supabase SDK and SSR helper are pinned to compatible versions; server clients supply the
`ws` transport for the project's Node.js 20 runtime.

```powershell
npm ci
npm run db:start
npm run db:env
npm run db:lint
npm run db:test
npm run db:test:integration
npm run db:types
npm run dev
```

`db:start` applies migrations and seeds on the first start. Supabase Studio is at
http://127.0.0.1:54323. The API is at http://127.0.0.1:54321.
`db:env` creates the Git-ignored `.env.local` from local credentials without printing secrets.
It refuses to overwrite an existing file. `db:stop` stops the containers and preserves local data.
To intentionally switch an existing `.env.local` to the reference local project, use
`npm run db:env -- --use-local`; this preserves unrelated variables.

For a **disposable local database only**, `npx supabase db reset --local` reapplies migrations
and fixtures and deletes existing local records. Do not reset a database with data you need.

The reference shop uses `Asia/Manila`, PHP, two barbers, five services, Monday–Saturday
09:00–12:00 and 13:00–19:00. These are development fixtures, not real business details.
No user accounts or customer appointments are seeded.

## Hosted project

Creating a hosted project requires your Supabase account and organization. This repository
does not provision a cloud project or contain cloud credentials.

1. Create a project in https://supabase.com/dashboard. Choose your organization, region, and
   project name; keep its database password in your password manager.
2. Log in to the CLI and link the project:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push --dry-run
   npx supabase db push
   ```

3. Do not use `--include-seed` on a live shop. Create the real business, services, schedules,
   and barbers using trusted SQL or the later admin dashboard. New businesses default to inactive.
4. Set the project URL, anon key, and service-role key from the project's API settings in your
   hosting environment (or `.env.local` for local development against the hosted project).
   Set `NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG` to the real business slug. Never commit credentials.
   The service-role key is server-only. The public key is protected by RLS and grants.
5. In hosted Auth settings, disable public sign-ups and anonymous sign-ins. Admin users are
   provisioned by invitation. Set the Site URL and allowed redirect URLs to the actual app URLs.
   Local `config.toml` settings do not automatically configure an existing hosted Auth instance.
6. Invite the initial owner via Auth, then provision their membership through the SQL editor:

   ```sql
   insert into public.business_members (business_id, user_id, role)
   values ('BUSINESS_UUID', 'AUTH_USER_UUID', 'owner');
   ```

Membership changes and tenant creation are intentionally restricted to trusted server/admin SQL.
Owners cannot grant themselves access to another shop through the API. Revoke access by removing
the membership row. Staff can manage appointments; owners also manage catalog and schedules.
The login UI and session-refresh proxy will be implemented in Phase 5 before admin functionality
is exposed.

## Data model

| Table | Purpose | Public access |
| --- | --- | --- |
| `businesses` | Public profile, timezone, currency, booking limits | Active businesses |
| `business_members` | Supabase Auth user membership and owner/staff role | None |
| `services` | Price in minor currency units, duration, marketing content | Active services in active shops |
| `barbers` | Public profiles | Active barbers in active shops |
| `barber_services` | Services each barber performs | Active public assignments |
| `business_hours` | Weekly opening intervals | Active shop schedules |
| `barber_hours` | Weekly barber working intervals | Active shop schedules |
| `schedule_overrides` | Closed dates or special hours for shop/barber | Active shop schedules |
| `time_off` | Dated breaks/holidays with private reasons | None |
| `appointments` | Guest contact details, service snapshots, appointment bounds/status | None |

Every tenant-owned relationship uses composite foreign keys including `business_id`.
Appointments reference an actual barber/service assignment. Historical references restrict deletion:
disable services/barbers instead of deleting ones used by appointments.

Times in weekly hours and date overrides are local civil times in the shop timezone. Weekdays use
ISO numbering (Monday = 1, Sunday = 7); missing intervals mean closed/unavailable. Multiple weekly
intervals support recurring breaks. Date overrides replace weekly hours for that shop/barber on
that day. `time_off` uses UTC instants and may apply to the entire shop (`barber_id = NULL`).
Overnight hours must be split into separate dates. Availability intersects shop and barber hours
and subtracts time off and occupied appointments.

Appointments store UTC bounds, service name, duration, price, and currency snapshots. The duration
must match the bounds. A partial GiST exclusion constraint prevents overlap for `pending` and
`confirmed` appointments with the same business/barber, including concurrent writes. Ranges
are half-open, so back-to-back bookings are permitted. Cancellation releases the slot while
preserving history. SQLSTATE `23P01` becomes the friendly slot-unavailable error in Phase 4.

The constraint protects occupancy. Phase 4 validates business hours, active assignments,
notice/window settings, customer inputs, and availability through server-only booking RPCs.
No guest insert policy or public appointment lookup exists. A signed browser cookie gates the
restricted confirmation projection; a reference code alone does not grant access to customer records.

## Images and types

`business-images` is a public marketing bucket, limited to 5 MiB JPEG, PNG, WebP, and AVIF files.
Owners can manage paths under `<business UUID>/<filename>`. Public files remain publicly retrievable
even after a shop is disabled; delete marketing assets when they must be removed from public access.
Do not store customer information there.

`src/lib/types/database.ts` is generated from the applied local schema using `npm run db:types`.
Commit regenerated types whenever a migration changes the public schema. Public catalog helpers
use the ordinary server client with RLS; service-role access is reserved for validated server work.

References: [Supabase migrations](https://supabase.com/docs/guides/local-development/database-migrations),
[RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Storage access](https://supabase.com/docs/guides/storage/security/access-control), and
[generated types](https://supabase.com/docs/guides/api/rest/generating-types).
