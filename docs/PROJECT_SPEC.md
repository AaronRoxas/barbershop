# Barbershop Booking Platform — Project Specification

## 1. Project Overview

Build a modern website and online booking platform for a haircutting/barbershop business.

The system will consist of:

### Public Website

Customers can:

- Learn about the barbershop
- View services
- View barbers
- View business information
- Book appointments
- Receive booking confirmation

### Admin Dashboard

Business owners can:

- Manage appointments
- Manage services
- Manage barbers
- Manage availability
- Manage business information

---

# 2. Primary Goal

Make booking an appointment extremely simple.

Target customer journey:

Homepage
→ Book Appointment
→ Select Service
→ Select Barber
→ Select Date
→ Select Time
→ Customer Information
→ Review
→ Confirmation

---

# 3. Public Pages

## Homepage

Sections:

- Header
- Hero
- Primary booking CTA
- Featured services
- Why choose us
- Barbers
- Testimonials
- Location
- Business hours
- Contact
- Footer

Primary CTA:

**Book an Appointment**

---

## Services

Display:

- Service name
- Description
- Price
- Duration
- Image
- Book button

Services must come from the database.

---

## About

Include:

- Business story
- Philosophy
- Values
- What makes the barbershop different
- Photos

---

## Barbers

Each barber may have:

- Name
- Photo
- Biography
- Specialty
- Services
- Availability

Barber functionality should be optional for businesses with only one barber.

---

## Contact

Include:

- Address
- Phone
- Email
- Business hours
- Map
- Social media

---

# 4. Booking

## Step 1 — Service

Customer selects a service.

Display:

- Name
- Description
- Price
- Duration

---

## Step 2 — Barber

Customer may select:

- Any available barber
- Specific barber

---

## Step 3 — Date

Display available dates.

Disable:

- Past dates
- Closed dates
- Blocked dates
- Fully booked dates

---

## Step 4 — Time

Display available appointment slots.

Slots must be generated dynamically.

---

## Step 5 — Customer Information

Required:

- Full name
- Email
- Phone

Optional:

- Notes

---

## Step 6 — Review

Display the complete booking summary.

---

## Step 7 — Confirmation

Create the appointment and display a confirmation page.

Generate a unique confirmation/reference number.

---

# 5. Appointment Management

Admins can:

- View appointments
- Create appointments
- Edit appointments
- Reschedule
- Cancel
- Confirm
- Complete
- Mark no-show

Appointment statuses:

- Pending
- Confirmed
- Completed
- Cancelled
- No-show

---

# 6. Services Management

Admins can:

- Create services
- Edit services
- Delete services
- Disable services
- Change prices
- Change durations
- Change descriptions
- Upload images
- Reorder services

---

# 7. Barber Management

Admins can:

- Create barber
- Edit barber
- Disable barber
- Upload photo
- Set specialties
- Set availability
- Assign services

---

# 8. Scheduling

Admins can configure:

- Business hours
- Break periods
- Days off
- Holidays
- Blocked dates
- Special hours
- Minimum booking notice
- Maximum booking window
- Appointment interval

---

# 9. Notifications

Initial notification system:

- Booking confirmation email
- 24-hour reminder email

Future:

- SMS
- Same-day reminders
- Cancellation notifications
- Rescheduling notifications

---

# 10. Admin Dashboard

Dashboard should display:

- Today's appointments
- Upcoming appointments
- Pending appointments
- Completed appointments
- Cancelled appointments

Optional:

- Revenue
- Booking statistics
- Popular services

---

# 11. Authentication

Admin dashboard requires authentication.

Customer booking should not require account creation initially.

Keep customer booking friction low.

---

# 12. Design

Visual style:

- Premium
- Modern
- Clean
- Stylish
- Professional
- Welcoming

Avoid generic templates.

Mobile booking experience is a priority.

---

# 13. Performance

Prioritize:

- Fast loading
- Optimized images
- Minimal client JavaScript where possible
- Efficient database queries
- Responsive design

---

# 14. SEO

Public pages should support:

- Metadata
- Semantic headings
- SEO-friendly URLs
- Local business information
- Image alt text
- Open Graph metadata

---

# 15. Accessibility

Support:

- Keyboard navigation
- Screen readers
- Proper form labels
- Focus states
- Color contrast
- Semantic HTML

---

# 16. Development Strategy

Do not build everything simultaneously.

Recommended phases:

### Phase 1

Project setup and architecture.

### Phase 2

Database and Supabase configuration.

### Phase 3

Public website.

### Phase 4

Booking system.

### Phase 5

Admin dashboard.

Implemented requirements:

- Allow owners to customize landing-page information from the admin dashboard.
- Add a delete option for barber profiles, preserving appointment history and explaining when deletion is blocked.
- Use separate navigation bars and footers for the admin dashboard and public landing page.
- Remove the display-order field from the barber profile edit form.

### Phase 6

Notifications.

### Phase 7

Testing, security, SEO, performance, and polish.
