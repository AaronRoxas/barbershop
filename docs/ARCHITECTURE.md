# Architecture

This document records decisions from Phases 1–4. Application code should follow it. Update this file when a decision changes.

## Product shape

- Multi-tenant **data model** from day one.
- Single-tenant **URLs** for the first shop (`NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG`).
- Public marketing site + `/book` wizard + protected `/admin`.
- Customers book as guests (no account) in v1.

## Stack

- Next.js App Router, React, TypeScript (strict), Tailwind CSS
- Zod for env and booking request validation
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
revalidates through a service-role-only PostgreSQL RPC in Phase 4. The Phase 2 Postgres exclusion constraint is the final
concurrency guard for pending/confirmed appointments. See `docs/SUPABASE_SETUP.md` for the schema,
roles, scheduling conventions, local commands, and hosted setup.

Tenant relationships include `business_id` in foreign keys. Membership is provisioned through trusted
server/admin SQL, never self-assigned through the API. Staff manage appointments; owners also manage
catalog, schedules, and public marketing images. Guest users cannot read or write appointment records.
Use integer minor units for prices and preserve service/price/duration/currency snapshots on bookings.

## Time

Store appointment bounds as `timestamptz` (UTC instants). Interpret civil `date` / `time` values only in `businesses.timezone`.

## Public website

Phase 3 public pages are Server Components. `src/lib/site/data.ts` resolves the configured active
business and deduplicates catalog reads with React's request-scoped cache. `src/components/public`
contains shared service, barber, hours, and image rendering. The mobile navigation and retry boundary
are small Client Components. Public pages filter active catalog records and published testimonials
explicitly, including when a shop owner is signed in.

Marketing fields and testimonials are stored in Supabase; only owners manage testimonials, and
public users see published quotes in active shops. Missing details stay empty instead of being
invented. Uploaded image paths must belong to the current business. The sample interior asset is
local, generated, and visibly labeled. See `docs/PUBLIC_WEBSITE.md` for content, SEO, and verification.

Booking links carry validated service/barber IDs into the `/book` wizard. Reservations are created
only after final server validation. Usual working hours are not a promise of appointment availability.

## Guest booking

PostgreSQL computes availability and revalidates it in the write RPC so UI and final validation
share the same scheduling rules. Invoker RPCs are restricted to `service_role`; server entry points
resolve the configured business and validate inputs. An uncached GET route returns seven days
of slots without customer data. The exclusion constraint handles competing bookings; request UUIDs
and advisory locks make retries idempotent. A signed browser cookie gates confirmation rendering,
which uses a restricted projection without customer contact details. See `docs/BOOKING.md`.

## Implementation phases

1. Project setup (complete)
2. Database and Supabase (implemented locally; hosted setup is account-dependent)
3. Public website (complete for the reference shop)
4. Booking system (implemented and verified locally)
5. Admin dashboard
6. Notifications
7. Testing, security, SEO, performance, polish
