# Phase 4: Guest booking

`/book` now implements service → barber → available date → time → customer details → review → confirmation.
Service and barber links preselect valid catalog identifiers. Guests do not need an account.
Only active services and assigned active barbers can be booked. “Any available barber” always saves
a concrete barber, chosen deterministically from the available chairs.

## Setup

Apply `20261008000400_booking.sql` to the target Supabase database. The reference service catalog
is updated by `20261008000500_reference_services.sql`. For an existing local database:

```powershell
npx supabase migration up --local
npm run db:types
npm run dev
```

The server requires `SUPABASE_SERVICE_ROLE_KEY` as well as the public shop configuration.
The migration preserves existing appointments. For hosted setup, follow `SUPABASE_SETUP.md` and
review pending migrations before applying them; development fixtures must remain local.

## Availability and writes

PostgreSQL is the source of truth for both displayed availability and final booking validation.
`booking_slots` intersects shop and barber schedules, replaces weekly hours with date overrides,
and subtracts shop/barber time off and pending/confirmed appointments. Missing hours mean closed.
The grid starts at each shop opening interval using `slot_interval_minutes`. The full duration must
fit inside both opening intervals. Past slots, minimum notice, and the maximum booking date are
enforced using the business timezone and database clock. The last booking date is inclusive.

Civil dates/times are converted by PostgreSQL's timezone database. Nonexistent DST start times
are discarded; ambiguous times use PostgreSQL's standard-time interpretation. Both local duration
and UTC end bounds must fit before closing. Appointment bounds are stored as UTC instants.

`GET /api/booking/availability` returns seven days of slot bounds and barber IDs with `Cache-Control:
no-store`, never customer data or time-off reasons. Dates with no slots are disabled, including
closed, blocked, and fully booked days. The monthly calendar loads its availability in parallel
seven-day batches, limited to the booking window. Past dates and dates after the window are disabled.
Customers navigate months and select an available day before choosing Morning (before 12pm),
Afternoon (12pm to before 6pm), or Night (from 6pm), all interpreted in the shop timezone.
Periods with no slots are disabled; choosing a period reveals a native time dropdown containing
only that period's available slots. Switching date or period clears the previous time selection.
Failures offer refresh; changing a selection clears dependent selections.

## Reference service estimates

These user-approved estimates are development catalog values and can be revised before launch.
Existing appointment service/price/duration snapshots remain unchanged. Skin Fade is retired
without deleting its history; Beard Trim becomes Beard Grooming. Both reference barbers are assigned
all five active services. Fresh seeds and existing local databases use the same menu.

| Service | Estimated price | Duration |
| --- | --- | --- |
| Classic Haircut | ₱250 | 30 minutes |
| Beard Grooming | ₱200 | 30 minutes |
| Colors and Treatment | ₱1,200 | 120 minutes |
| Kid’s Haircut | ₱200 | 30 minutes |
| Haircut Consultation | ₱100 | 15 minutes |

## Booking submission

The Server Action validates all input with Zod and resolves the tenant from server configuration.
`create_guest_booking` validates inputs, rereads active configuration, recomputes availability,
and inserts the appointment with database-derived service/price/duration/currency snapshots.
No client price, duration, business identifier, or appointment status is trusted. All three RPCs
are invoker functions restricted to `service_role`; anon/authenticated execution is revoked.

The existing GiST exclusion constraint prevents competing writes from occupying the same chair.
SQLSTATE `23P01` produces the friendly slot-unavailable message. Any-barber submissions can try
another eligible chair after a conflict. A client-generated random request UUID and transaction
advisory lock make identical retries return the original reference rather than create duplicates.
Reusing that request UUID with changed details is rejected. Customer details remain available in
the wizard while the customer chooses another time.

## Confirmation and privacy

Appointments start as `pending`, occupying the chair while awaiting shop confirmation. The result
redirects to `/book/confirmed/BRB-<random UUID>` and sets a signed, HttpOnly, SameSite=Lax browser
cookie lasting seven days (Secure in production). The signature is HMAC-SHA256 with the server-only
service-role credential and a domain-specific prefix. Rotating that credential invalidates cookies.

The confirmation route checks the signature and tenant before selecting a restricted projection.
It shows only the reference, status, service snapshot, price, assigned barber, and shop-local times.
It never displays customer names, email, phone, or notes. Knowing the reference alone does not
authorize lookup. Cookies authorize only the latest booking in that browser; an older reference or
another browser shows contact instructions. Confirmation pages are not indexed and set no-referrer.

Changes/cancellations direct customers to the shop. Staff manage appointments through the Phase 5
dashboard described in `ADMIN.md`. Email and
reminders remain Phase 6; the booking flow does not promise an email. Automated abuse prevention
and deployment-specific rate limiting should be assessed in Phase 7 before opening a live shop.

## Verification

```powershell
npm run lint
npm run db:lint
npm run db:test
npm run db:test:integration
npm run db:test:booking
npm run test:e2e
```

Booking integration tests create and remove isolated local fixtures. They cover timezone conversion,
breaks and duration boundaries, date windows and notice, date overrides and time off, inactive
records, snapshots, cancellation, input validation, RPC permissions, concurrent slot conflicts,
concurrent identical retries, and any-barber assignment. Browser tests run the production build
on desktop/mobile, check accessibility across the flow, create a competing booking after slot
selection, recover to another slot without losing contact details, verify reload and confirmation
privacy (including a forged cookie), and exercise availability outages. Browser fixtures remove
only appointments matching each test's random customer email in the local reference shop.
