# Architecture

This document records decisions from Phases 1 and 2. Application code should follow it. Update this file when a decision changes.

## Product shape

- Multi-tenant **data model** from day one.
- Single-tenant **URLs** for the first shop (`NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG`).
- Public marketing site + `/book` wizard + protected `/admin`.
- Customers book as guests (no account) in v1.

## Stack

- Next.js App Router, React, TypeScript (strict), Tailwind CSS
- Zod for env and (later) request validation
- Supabase Postgres, Auth, Storage
- `@supabase/ssr` for cookie-based server clients
- Service-role client only on the server (`server-only`)

## Confirmed product rules

1. Always persist a concrete `barber_id`, including “any available barber.”
2. Display shop timezone (`businesses.timezone`), not the device timezone.
3. Slot grid uses `slot_interval_minutes`; duration occupies the chair and must fit before close.
4. Guest booking writes go through the server (Server Action or RPC), never a public table insert.

## Layering

| Layer | Location |
| --- | --- |
| UI | `src/components/*` |
| Routes | `src/app/*` |
| Auth helpers | `src/lib/auth` |
| Database access | `src/lib/db` |
| Booking rules | `src/lib/booking` |
| Timezone / slots | `src/lib/time` |
| Zod schemas | `src/lib/validation` |
| Domain types | `src/lib/types` |
| Supabase clients | `src/lib/supabase` |
| SQL | `supabase/migrations` |

Booking availability and appointment writes must not live in UI components.

## Supabase clients

- **Browser:** anon key + user session (admin dashboard later).
- **Server:** anon key + cookies (RLS as the logged-in user).
- **Admin:** service role, server-only, after application validation. Never expose this key to the client.

Public catalog reads use RLS through typed clients and `src/lib/db/catalog.ts`. Appointment creation
will re-validate on the server in Phase 4. The Phase 2 Postgres exclusion constraint is the final
concurrency guard for pending/confirmed appointments. See `docs/SUPABASE_SETUP.md` for the schema,
roles, scheduling conventions, local commands, and hosted setup.

Tenant relationships include `business_id` in foreign keys. Membership is provisioned through trusted
server/admin SQL, never self-assigned through the API. Staff manage appointments; owners also manage
catalog, schedules, and public marketing images. Guest users cannot read or write appointment records.
Use integer minor units for prices and preserve service/price/duration/currency snapshots on bookings.

## Time

Store appointment bounds as `timestamptz` (UTC instants). Interpret civil `date` / `time` values only in `businesses.timezone`.

## Implementation phases

1. Project setup (complete)
2. Database and Supabase (implemented locally; hosted setup is account-dependent)
3. Public website
4. Booking system
5. Admin dashboard
6. Notifications
7. Testing, security, SEO, performance, polish
