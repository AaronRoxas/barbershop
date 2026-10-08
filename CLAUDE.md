# Barbershop Booking Platform

## Project Overview

This project is a reusable, multi-tenant appointment booking platform for barbershops and haircutting businesses. The first implementation will serve as a reference barbershop, but the underlying product must be designed to support multiple independent businesses.

The platform has two major areas:

1. Public customer-facing website
2. Protected admin dashboard

The primary business functionality is online appointment scheduling.

Read `docs/PROJECT_SPEC.md` before implementing major features.

---

## Core Priorities

Prioritize these requirements in this order:

1. Reliable appointment booking
2. Prevent double bookings
3. Excellent mobile booking experience
4. Simple admin scheduling
5. Clean and modern UI
6. Secure customer/admin data
7. Maintainable architecture
8. Fast performance
9. SEO
10. Accessibility

---

## Technology

Preferred stack:

- Next.js
- TypeScript
- React
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Authentication
- Server-side validation
- Zod where appropriate

Do not introduce additional frameworks or services without a clear reason.

---

## General Development Rules

- Use TypeScript.
- Prefer Server Components where appropriate.
- Use Client Components only when interactivity requires them.
- Keep components small and reusable.
- Avoid unnecessary abstraction.
- Avoid duplicated business logic.
- Keep business logic separate from UI components.
- Validate important data on both client and server.
- Never trust client-side validation alone.
- Never trust client-side availability checks for appointments.
- Perform final booking validation server-side.
- Protect all admin routes.
- Never expose private customer information.
- Never expose Supabase service-role credentials to the client.
- Use environment variables for secrets.
- Handle loading, error, empty, and success states.
- Design mobile-first.
- Maintain accessibility.
- Keep SEO in mind for public pages.

---

## Booking System

The booking system is the most important part of the application.

The server must be responsible for:

- Checking availability
- Validating appointment times
- Preventing double bookings
- Validating services
- Validating barber availability
- Validating business hours
- Handling blocked dates
- Creating appointments
- Updating appointment status

Never rely solely on the frontend to determine whether a slot is available.

Consider race conditions when two customers attempt to book the same appointment simultaneously.

---

## Security

Never:

- Expose database credentials
- Expose service-role keys in browser code
- Trust user-submitted admin identifiers
- Allow unauthenticated users to access admin functionality
- Return unnecessary customer information through public APIs

Admin functionality must be protected by authentication and authorization.

---

## UI/UX

The public website should feel:

- Modern
- Premium
- Clean
- Stylish
- Professional
- Welcoming

Avoid:

- Generic template designs
- Excessive gradients
- Excessive animations
- Overly complicated interfaces
- Clutter
- Unnecessary cards

The booking flow should be extremely simple.

Target flow:

Service → Barber → Date → Time → Customer Details → Review → Confirmation

---

## Before Major Changes

Before implementing a major feature:

1. Read the relevant documentation.
2. Inspect the existing code.
3. Understand how the feature fits the architecture.
4. Explain the proposed approach briefly.
5. Implement the feature.
6. Test the feature.
7. Check for regressions.

Do not rewrite unrelated working code.

---

## Code Quality

Prefer simple, readable solutions over clever ones.

Use meaningful names.

Example:

Good:

`getAvailableAppointmentSlots()`

Avoid:

`processData()`

Keep functions focused on one responsibility.

---

## Documentation

When making an important architectural decision, update the appropriate documentation in `/docs`.

Important decisions should not exist only inside chat history.

---

## Current Development Phase

Phase 2 database and Supabase implementation is in place locally. See `docs/SUPABASE_SETUP.md`
for migrations, security tests, fixtures, and hosted setup. Next: Phase 3 — public website.

Build the application incrementally according to:

`docs/PROJECT_SPEC.md`

Do not attempt to build the entire application in one step.

Read `docs/ARCHITECTURE.md` before changing structure or booking rules.
