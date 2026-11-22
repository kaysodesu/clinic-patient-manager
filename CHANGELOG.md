# Changelog

## 1.2.0 (2026-11-22)

Easier to open, and a public demo you can share.

### Added
- **Double-click launchers:** `Start Clinic Patient Manager (Windows).bat` and `start-mac-linux.sh` check for Node.js, install on first run, start the app and open the browser. This fixes "nothing happens when I open the files."
- **Public demo mode** (`npm run build:demo`):
  - a 20-minute free preview per browser, with a countdown bar;
  - "Join Discord for perks" and "Get the full version" buttons;
  - a lock screen when time runs out, offering *Request extended access*, *Get the full version* and an access-code box that unlocks for 7 days (codes stored as SHA-256 hashes);
  - visitors can add their **own Gemini key**, kept in their browser, to run the AI auditor, with friendly error messages.
  - All settings are in `src/config/demo.ts`.
- `npm run publish:demo`: rebuilds the demo and publishes only the compiled site (no source) to a public GitHub Pages repo.

### Changed
- The AI auditor's reviewer prompts moved to `src/shared/auditPrompts.ts`, so the server and the demo use the same ones.
- The old amber demo banner was replaced by the new preview bar.

## 1.1.0 (2026-11-16)

Cleaner, faster layout for busy clinicians.

### Changed
- **One navigation menu** built from `src/config/navigation.ts`, grouped into Patient care, Patient access, Front office and Admin & IT. The desktop sidebar and mobile menu can no longer drift apart.
- **Plain section names:** Patients, Visits & notes, Prescriptions, Messages & summaries, New patient intake, Patient portal, Patient profile, Outreach & feedback, IT support, Diagnosis reference, Code & prompt auditor.
- **"Marketing Hub" and "Feedback Hub" merged** into one *Outreach & feedback* item (they opened the same screen).
- **One page header style:** the top bar now shows every page's title and a one-line description (two pages had none). The large duplicate banners on Visits & notes, Messages & summaries, Outreach, IT support, Diagnosis reference and the code auditor were replaced with slim toolbars.
- **New shared components:** `PatientSwitcher` and `SubTabs` in `src/components/ui/`.
- **Patients first:** the ID and wristband scanner is folded into a one-line "Scan an ID or wristband" bar (it remembers whether you left it open).
- **Diagnosis reference:** condition cards show a summary with a "Show medications, warnings & after-care" toggle. The page went from about 4,000px tall to about 1,500px.
- **Plain-language headings and buttons** throughout. For example, "Formulate Encounter Report" became *Encounter note & coding*, "Commit Visitation Report to Patient Dossier" became *Save visit & close*, and "Register to Ledger & Issue Copay" became *Register patient*.
- Removed the decorative "Diagnostic clock" and the hard-coded "Server status: Active" footer. The sidebar now stays in place while the page scrolls.

### Fixed
- **Blank page in development** after running `npm run build:demo`: Vite scanned the `dist-demo/` output as source and failed. Dependency scanning is now limited to the real app.
- **Mobile menu couldn't scroll** to the last items on short phones.
- **Tall sidebar** could push items off-screen on small laptop displays.

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
