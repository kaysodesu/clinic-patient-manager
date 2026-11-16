# Clinic Patient Manager

A full-stack starter for clinics and private practices: patient intake, records, visits with current ICD-10 / CPT coding, prescriptions, billing, secure records, patient communications, and staff accounts with roles. Built with React 19, TypeScript, Vite, Tailwind CSS 4, Express and Postgres.

Skip the first months of building a practice-management app and start from a working, rebrandable product.

> **Important:** this is a starting point, not a certified medical records system. It is **not HIPAA compliant out of the box.** Read [docs/SECURITY-AND-HIPAA.md](docs/SECURITY-AND-HIPAA.md) before storing real patient information.

---

## What's included

| Area | Features |
|---|---|
| **Front desk** | ID / wristband scanner simulation, guided 4-step patient intake, patient directory with status tracking |
| **Clinical** | Visit records with diagnosis (ICD-10-CM) and billing (CPT / HCPCS) codes, progress notes with comment threads, scheduling, patient transfers and referrals |
| **Prescriptions** | Prescription ledger with allergy cautions |
| **Secure records** | Consent-signed conversation records, after-visit summaries, role-restricted access with audit logging |
| **Billing** | Copay invoices, payments, payment plans |
| **Communications** | SMS / email reminders, newsletters, consent requests, feedback surveys |
| **Patient portal** | Staff-run portal view with patient / POA / family access modes |
| **Diagnostic database** | 2026 primary-care code set (151 codes) and a conditions library linked to ICD-10, with treatment guidance |
| **Accounts & roles** | Staff sign-in, first-run administrator setup, five roles, staff management, password resets, brute-force protection |
| **Onboarding** | Guided and automatic tours, 12 how-to walkthroughs, built-in user manual, Help button |
| **Extras** | 5 realistic test-patient scenarios, shareable demo build, Render deploy blueprint, optional AI code auditor (Gemini) |

---

## Quick start

**Requirements:** Node.js 20 or newer.

```bash
npm install
cp .env.example .env      # optional for local testing
npm run dev               # http://localhost:3000
```

The first time you open the app it asks you to **create the administrator account**. Sign in, then use **Setup & integrations** (a checklist of what this installation still needs, plus your own AI key) and **Staff & access** (to add your team) in the sidebar.

Without `DATABASE_URL` everything is kept in memory, which is fine for trying it out. Set up Postgres before real use (see Deploy).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload on port 3000 |
| `npm run build` | Production build (web app + server) into `dist/` |
| `npm start` | Run the production build |
| `npm run build:demo` | Server-free demo build in `dist-demo/` (data stays in the visitor's browser, roles switchable) |
| `npm run lint` | TypeScript type check |
| `npm run package` | Create a clean release zip in `release/` |

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | For production | Postgres connection string. Stores clinic records and staff accounts. |
| `SESSION_SECRET` | For production | Long random string that signs staff sessions. |
| `GEMINI_API_KEY` | No | Enables the AI Code & Prompt Auditor. Administrators can instead paste their own key in **Setup & integrations**. |
| `PORT` | No | Defaults to 3000. |

## Deploy (Render + Neon, free tiers)

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its connection string.
2. Push this project to a GitHub repository.
3. In [render.com](https://render.com) choose **New → Blueprint** and pick the repository. `render.yaml` sets everything up.
4. Paste the connection string as `DATABASE_URL`. Render generates `SESSION_SECRET` for you.
5. Open the site and create the administrator account.

Any Node host works (Railway, Fly.io, a VPS): run `npm ci && npm run build`, then `npm start`.

## Your data and keys stay yours
The product contains no API keys, accounts or connections to the seller or any third-party service. You connect **your own** database (`DATABASE_URL`), session secret and, optionally, your own Gemini AI key. Administrators see a reminder until the database is connected.

## Rebrand it

Edit **`src/config/brand.ts`**: facility name, tagline, product name, developer credit, address, portal URL and sender email. Every screen, message template and printed summary reads from that file. The page title is in `index.html`.

## Roles and access

| Role | Can open |
|---|---|
| Clinic Administrator | Everything, including staff accounts |
| Clinical Team Lead | Clinical work, emergency access to secure records |
| Operations Manager | Clinical work, IT desk, emergency access to secure records |
| IT Support | Clinical work, IT desk, AI code auditor |
| Database Administrator | Clinical work, diagnostic code and conditions database |

Change who can open what in **`src/auth/permissions.ts`**. The server enforces sign-in on every data route and roles on staff management and the AI auditor (`auth.ts`).

## Project structure

```text
server.ts                 Express server: auth, data API, AI auditor, static hosting
auth.ts                   Staff accounts, password hashing, signed session cookies
store.ts                  Key/value storage: Postgres (DATABASE_URL) or in-memory
src/
  App.tsx                 Layout, navigation and screen routing
  config/brand.ts         Rebranding
  auth/                   Sign-in, setup, account panel, staff manager, permissions
  components/             Feature screens (intake, visits, prescriptions, billing, ...)
  data/                   Code set, test patients, tutorial content
  hooks/                  Patient, billing and visit state with server sync
  sharedStorage.ts        Syncs clinic data between the browser and the server
docs/                     Test scenarios, security and HIPAA notes
```

## Test data

On **Patients**, **Load Test Patients** adds five fictional scenarios (annual physical, chronic care, pediatric strep, telehealth follow-up, Medicare wellness visit). See [docs/TEST-SCENARIOS.md](docs/TEST-SCENARIOS.md).

## Roadmap ideas

- Patient self-service accounts (needs per-patient data isolation on the server)
- Per-record server API instead of whole-list sync, for larger clinics and concurrent editing
- Email delivery for password resets and reminders
- Two-factor sign-in

## License

Commercial license, see [LICENSE.md](LICENSE.md). Medical codes and guidance are reference material only. Verify codes against the licensed CPT®, HCPCS and ICD-10-CM code books before billing. CPT® is a registered trademark of the American Medical Association.
