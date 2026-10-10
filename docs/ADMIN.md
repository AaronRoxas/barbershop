# Phase 5: Shop administration

`/admin/login` signs in Supabase Auth users with email and password. `/admin` and all management pages require a current membership in the configured shop. Customers still book as guests.

## Setup

Apply all migrations through `20261008000900_booking_private_access.sql` and regenerate types:

```powershell
npx supabase migration up --local
npm run db:types
```

To create your first **local reference-shop owner**, run this in an interactive terminal:

```powershell
npm run admin:local -- --email owner@example.com
```

The helper prompts for a masked password of at least 12 characters, uses only the CLI's loopback
Supabase project, and creates a confirmed Auth user plus an owner membership. It does not read
hosted credentials or save/print the password. Existing accounts are not overwritten. For an existing
account, use Supabase Studio to add its `business_members` row. No permanent admin accounts are seeded.
Then run `npm run dev` and open `/admin/login`.

For hosted shops, follow `SUPABASE_SETUP.md`: disable public sign-ups, provision the business and
initial membership through trusted SQL, and invite the account using Supabase Auth. Membership
must exist before the account can open the password page. Configure Auth's Site URL to your app
origin and change the invitation email link to:

```html
<a href="{{ .SiteURL }}/admin/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Accept invitation</a>
```

For recovery emails issued through Supabase Auth, use the same link with `type=recovery`.
`/admin/auth/confirm` accepts only invitation/recovery token hashes, verifies them with Supabase,
sets session cookies, and redirects to `/admin/password`. Invalid/expired links show a login error.
Password changes require a verified user and shop membership. Recovery email requests and
membership administration are handled by the owner through Supabase, not exposed publicly here.
Local email testing uses the Supabase mail inbox. Hosted email configuration remains account-dependent.

## Access

| Capability | Staff | Owner |
| --- | --- | --- |
| View overview and customer appointments | Yes | Yes |
| Create/edit/reschedule and change appointment status | Yes | Yes |
| Manage services, prices, durations, images, display order | No | Yes |
| Manage barber profiles/photos and assigned services | No | Yes |
| Manage shop/barber hours, special dates, time off | No | Yes |
| Manage public shop information and booking settings | No | Yes |
| Provision memberships or additional tenants through the UI | No | No |

`requireAdmin` verifies the Auth user and rereads the configured business and membership at the
data layer. Its React cache is request-scoped. Every page/query/action checks access independently;
the layout is not the security boundary. Tenant IDs come from server configuration, never a submitted
shop identifier. Ordinary authenticated clients use RLS for catalog, schedule and storage changes.
Staff are redirected when opening owner pages, and revoking membership removes access on the next request.

The Next.js `src/proxy.ts` refreshes Auth cookies on admin requests, passes refreshed cookies to
Server Components and the browser, and preserves the SSR helper's cache headers. All admin responses
are private/no-store and noindex/nofollow with no-referrer. The proxy does not authorize shop access.
No customer contact information is returned from public booking endpoints.

This follows the installed Next.js authentication/Server Action guidance and the
[Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).

## Appointment management

The overview shows today's, upcoming, pending, completed and cancelled counts. Today's date is
computed in the shop timezone. Upcoming means future pending/confirmed bookings. The appointment
list supports shop-local date bounds, status and barber filters, and 50-row pages. The same date and
occupancy rules drive the counts and views. Detail pages show the reference, historical service,
price/duration snapshots and private customer contact/notes.

`manage_admin_appointment` is an authenticated-only, membership-checked database transaction.
Direct authenticated appointment INSERT/UPDATE grants are revoked, so API callers cannot bypass
scheduling validation. The RPC's definer search path is locked; its tenant membership check is
performed before any privileged operation. Guest RPCs remain service-role-only.

New appointments are pending or confirmed and get a request UUID for idempotent retries. The server
validates customer fields; PostgreSQL converts the submitted civil timestamp in the shop timezone
and rejects nonexistent DST times. Scheduling uses `private.available_slots`, also used by the guest
RPC: active shop/service/barber assignment, notice/window limits, opening intervals, duration fit,
grid, date overrides, time off and chair occupancy all apply. Same-service rescheduling retains the
original name, price, duration and currency; choosing a different service takes new catalog snapshots.

Existing rows are locked, and their expected `updated_at` is compared before an edit. A stale or
concurrent edit is rejected with a reload message. The appointment being moved is excluded from its
own availability check, so overlapping its former time is permitted. The exclusion constraint remains
the final guard against concurrent guest/admin bookings. A rejected edit leaves the prior row intact.
Form controls are disabled while a save is pending so a refresh cannot discard a second edit.

Pending/confirmed bookings can be confirmed, cancelled, completed or marked no-show. Completed/no-show
requires that the appointment has started. Completed, cancelled and no-show records cannot be reopened
or rescheduled; contact corrections remain possible. Cancellation preserves history and releases the
chair. Appointments cannot be deleted through the application. No emails are promised or sent by these
appointment actions; notifications remain Phase 6.

## Catalog, schedules and images

Service prices are integer minor units; the UI explains the configured currency's scale. Display order
is explicit. Unused services can be deleted; services/barber assignments used by appointments are
protected by foreign keys and should be disabled/retained. Barber service sets are replaced atomically;
new barbers need assignments and hours before they can take bookings.

Weekly hours accept multiple `HH:MM-HH:MM` intervals per day, with empty days closed. An owner-only RPC
validates and replaces the complete weekly schedule atomically; overlapping or reversed intervals
are rejected. Special dates replace weekly hours for the shop or one barber. Remove an existing date
entry before adding a replacement. Time off uses shop-local start/end inputs, converted in PostgreSQL,
and supports whole-shop or individual-barber breaks with private reasons. The UI shows the first 500
special-date and time-off records. Remove outdated entries when approaching that limit.

Schedule changes affect new availability; they do not silently alter existing appointments. Owners
must review affected bookings and cancel/reschedule them separately. Changing timezone reinterprets
civil schedules while retaining stored appointment instants. Currency changes affect new snapshots;
the owner must update menu prices to match the new currency.

Image uploads check size, MIME type and file signatures, accept JPEG/PNG/WebP/AVIF up to 5 MiB, and
generate tenant-scoped random paths in `business-images`. The app allows 6 MiB Server Action bodies
to accommodate multipart overhead. Failed record updates attempt to remove the just-uploaded object.
Replacing an image retains old objects; remove obsolete public assets through Storage when needed.
The dashboard uploads service images, barber photos and the hero image. Gallery paths and testimonials
retain their existing trusted SQL/Storage management workflow. Public images must never contain customer data.

## Verification

```powershell
npm run lint
npm run db:lint
npm run db:test
npm run db:test:integration
npm run db:test:booking
npm run db:test:admin
npm run test:e2e
```

Admin integration tests create and clean up isolated local Auth users and businesses. They cover
staff/owner/outsider and cross-tenant permissions, direct-write denial, atomic schedule replacement,
local-time conversion, idempotent create, snapshot preservation, conflicting/off-grid reschedules,
time off, stale/concurrent edits, status transitions and historical assignment protection.
Desktop/mobile browser tests cover login, membership denial/revocation, recovery/password setup,
service creation and image upload, appointment creation/rescheduling/cancellation, barber creation and
assignments, weekly hours, special dates/time off, owner page restrictions, accessibility and narrow
screen overflow. Fixtures are removed after each run; no hosted data is used.
