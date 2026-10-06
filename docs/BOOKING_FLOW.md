# Booking Flow

## Customer Journey
Homepage
    ↓
Book Appointment
    ↓
Select Service
    ↓
Select Barber
    ↓
Select Date
    ↓
Select Time
    ↓
Customer Information
    ↓
Review
    ↓
Confirm
    ↓
Appointment Created
    ↓
Confirmation

---

# Service Selection

The customer selects one service.

Each service has:

- ID
- Name
- Description
- Price
- Duration
- Active status

---

# Barber Selection

The customer can select:

### Any Available Barber

The system determines which barbers are available.

### Specific Barber

The system only shows slots for that barber.

---

# Date Selection

The system must determine whether a date is bookable.

A date is unavailable when:

- Business is closed
- Date is blocked
- Date is in the past
- No barber is available
- No appointment slots remain

---

# Time Selection

The system calculates available slots based on:

Business Hours
+
Barber Availability
+
Service Duration
+
Existing Appointments
+
Breaks
+
Blocked Dates


---

# Example

Business:

9:00 AM → 7:00 PM

Break:

12:00 PM → 1:00 PM

Service:

45 minutes

Existing appointment:

2:00 PM → 2:45 PM

Available slots might include:

9:00 AM
9:45 AM
10:30 AM
11:15 AM
1:00 PM
1:45 PM
2:45 PM
3:30 PM
...

The exact slot generation strategy should be determined during implementation.

---

# Booking Validation

Before creating an appointment:

Validate customer
↓
Validate service
↓
Validate barber
↓
Validate date
↓
Validate time
↓
Validate business hours
↓
Validate barber availability
↓
Check appointment conflicts
↓
Create appointment
↓
Send confirmation

All critical validation must happen server-side.

---

# Double Booking

Two customers may attempt to book the same slot simultaneously.

The system must guarantee that only one booking succeeds.

The second customer should receive:

> This appointment time is no longer available. Please select another time.

Do not rely only on frontend availability checks.

---

# Cancellation

When an appointment is cancelled:

- Status becomes `cancelled`
- Appointment history remains
- Time slot becomes available again

---

# Rescheduling

When rescheduling:

Select new date
↓
Select new time
↓
Validate availability
↓
Update appointment
↓
Notify customer


---

# Confirmation

Successful booking should return:

Booking Confirmed

Reference: BRB-XXXXXX

Service: Skin Fade
Barber: John
Date: October 15, 2026
Time: 5:30 PM
Duration: 45 minutes
Price: ₱350

Location:
[Business Address]

Phone:
[Business Phone]


---

# Future Features

The architecture should allow future support for:

- Customer accounts
- Online payments
- Deposits
- SMS notifications
- Loyalty system
- Promo codes
- Multiple locations
- Recurring appointments
- Customer appointment history
- Analytics