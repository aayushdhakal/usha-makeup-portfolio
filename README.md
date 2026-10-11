# Usha Makeup and Nails

Custom appointment, client, and payment record system for the New Baneshwor studio.

## What it does

- Public booking page for makeup and nail services
- Private day calendar for staff and walk-ins
- Artist and station conflict checks at the database write
- Editable staff roles, working hours, service prices, and stations
- Client profiles with visit history and studio notes
- Branded receipts with advances, payment dates, balances, and due dates

## Local setup

Install dependencies with `npm ci`. Set `STUDIO_ADMIN_EMAILS`, `STUDIO_LOGIN_EMAIL`, and a salted PBKDF2 `STUDIO_PASSWORD_HASH` in a local ignored `.dev.vars` file. Configure production values through Sites runtime settings and mark the hash as a secret. Generate migrations with `npm run db:generate` after schema changes. Apply pending migrations to the local D1 database as described in the Sites starter workflow, then run `npm run dev`.

## Access and launch

Studio pages and write actions require either the configured email/password account or ChatGPT sign-in with an email in `STUDIO_ADMIN_EMAILS`. Password sessions expire after seven days and can be ended with Sign out. The public booking page has no client sign-in. Password reset emails are not configured. Before connecting ushamua.com, add services, prices, staff, and opening hours. Payments are recorded manually and are not processed by this app. Receipts are studio payment records.
