# Changelog

## 1.0.2 (2026-11-14)
- Sample phone numbers (pharmacies, intake demo, scanner cards) are now fictional 555-01xx numbers that can't reach real businesses or people

## 1.0.1 (2026-11-14)
Privacy and setup.

- **Setup & integrations** (administrators): a checklist of what the installation still needs (database, session secret) and a place to paste your own Gemini API key. Keys stay on your server and are only ever shown by their last 4 characters.
- Administrators see a reminder banner until a database is connected
- Removed a third-party IP and location lookup from the patient portal; network details are no longer collected
- All sample emails, links and images now use reserved example addresses; no real people's contact details
- The product contains no API keys, accounts or connections to the seller or any third-party service

## 1.0.0 (2026-11-14)
First commercial release.

- Staff accounts: first-run administrator setup, sign-in, five roles, staff management, administrator password resets, sign-in rate limiting
- Role-based access replaces all on-screen PIN codes (IT desk, diagnostic database, secure records)
- Central branding file (`src/config/brand.ts`); patient-facing messages use the clinic's name
- Postgres storage for records and accounts; Render deployment blueprint
- 2026 primary-care code set (ICD-10-CM, CPT, HCPCS) and ICD-10-linked conditions library
- Five test-patient scenarios with a one-click loader
- Guided and automatic tours, how-to walkthroughs, built-in user manual
- Server-free demo build for sharing a preview link
- Security and HIPAA notes, commercial license
