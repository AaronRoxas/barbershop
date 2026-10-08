# Phase 3: Public website

The reference website includes the homepage, service menu, shop story, barber profiles,
and contact page. The style uses warm ivory, dark green, serif headings, and a locally
stored sample interior image. The image is AI-generated and labeled as a reference visual;
it is not a photograph of an existing business. Barber portraits use initials until uploaded.

## Data and content

Public pages resolve the active business using `NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG`.
All catalog queries use the ordinary Supabase server client, tenant filters, and RLS.
React `cache()` deduplicates queries within a render without keeping tenant data across requests.
Public rendering never uses the service-role client.

Migration `20261008000300_public_content.sql` adds story, philosophy, hero/gallery image paths,
social links, and owner-managed testimonials. Apply it with:

```powershell
npx supabase migration up --local
npm run db:types
```

Use Supabase Studio to configure the public business fields:

| Content | Field/table |
| --- | --- |
| Name, description, address, phone, email, timezone | `businesses` |
| Shop story and philosophy | `businesses.story`, `businesses.philosophy` |
| Hero and gallery | `businesses.hero_image_path`, `businesses.gallery_image_paths` |
| Social links | `businesses.social_links`: HTTPS `instagram`, `facebook`, `tiktok` URLs |
| Service menu and prices | `services`, with integer minor currency units |
| Barber profiles, specialties, photos | `barbers` |
| Barber services and usual hours | `barber_services`, `barber_hours` |
| Shop opening intervals | `business_hours` |
| Approved reviews | `testimonials`, with `is_published = true` |

Upload real images to `business-images` under `<business UUID>/<filename>` and save that
bucket-relative path. The website only renders paths belonging to its configured business.
Next.js optimizes local and Supabase images; the remote allowlist is restricted to the configured
Supabase host and public marketing bucket. Loopback image optimization is enabled only when the
configured backend is local Supabase.

No real address, phone number, social account, customer review, or barber portrait has been invented.
Missing information has explicit empty states. Directions are available through Google Maps once
an address is supplied. Business and barber hours display the shop timezone and do not claim that
an appointment slot is available.

## Navigation and booking handoff

The header includes mobile navigation, active page indicators, and a primary booking link.
The footer includes public links and any configured social accounts. A keyboard skip link,
visible focus styles, semantic headings, descriptive image text, and responsive layouts support
accessibility. Loading, missing-configuration/business, data-error, and 404 states are included.

Service and barber links carry their identifiers into `/book`. That page validates selections
against the public catalog and displays an explicit booking-coming-soon message. It does not
create a reservation. Phase 4 now provides the appointment wizard and server booking validation;
see `BOOKING.md`. Only a successful booking submission saves an appointment.

## Search and sharing

Set `NEXT_PUBLIC_SITE_URL` to the real public origin before publishing a live shop. It provides
canonical URLs and Open Graph URL resolution. Metadata uses the configured business name;
page descriptions explain each public route. The reference shop, unavailable shop, and booking
pages are not indexed. For an active non-reference shop with a public origin, the sitemap includes
the five public pages and robots excludes admin/booking routes.

## Local verification

```powershell
npm run db:start
npm run db:env
npx playwright install chromium
npm run lint
npm run db:lint
npm run db:test
npm run test:e2e
```

If `.env.local` already exists and you intentionally want to switch to local Supabase,
`npm run db:env -- --use-local` updates only the Supabase settings and reference slug while
preserving unrelated entries. Default `db:env` refuses to overwrite the file.

Browser tests automatically build with local credentials and run a production server on port 3100;
they do not use or change hosted credentials. They expect the default local reference fixtures.
Tests cover the five pages, prices/durations, booking selections, mobile navigation, keyboard
access, 320px/tablet reflow, missing contact/review information, 404s, demo indexing rules, image
loading, and automated WCAG accessibility checks. Screenshots and failure traces are saved in
Git-ignored `test-results`. Automated accessibility checks are supplemented by visual review.

References: [Playwright browser testing](https://playwright.dev/docs/intro),
[accessibility testing](https://playwright.dev/docs/accessibility-testing), and
[test server configuration](https://playwright.dev/docs/test-webserver).

For an interactive local preview, use `npm run dev` and visit http://localhost:3000.
