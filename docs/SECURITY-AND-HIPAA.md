# Security and HIPAA notes

Clinic Patient Dashboard is a **starter codebase**. It gives you working features and sensible security basics, but **it is not a HIPAA-compliant system out of the box**, and buying it does not make your deployment compliant. Compliance depends on how you host, configure, operate and document your system.

## What's already in place
- Staff sign-in with individual accounts; no shared passwords.
- Passwords hashed with scrypt and a per-user salt.
- Signed, HTTP-only, SameSite session cookies that expire after 12 hours. They're marked `Secure` when served over HTTPS.
- Every data API route requires a signed-in user; staff management and the AI auditor also require specific roles.
- Sign-in rate limiting: 8 failed attempts per IP per 15 minutes.
- Role-restricted access to secure records, the IT desk and the diagnostic database, with denied attempts logged.
- No API keys in the browser; AI calls run on the server.

## What you must add before storing real patient information (PHI)
1. **A hosting provider and database that sign a Business Associate Agreement (BAA)** with you. Most free tiers do not.
2. **Encryption in transit and at rest:** HTTPS only, and an encrypted database and backups.
3. **Server-side audit logging** of every read and change to patient records, kept tamper-resistant. The built-in activity log is a client-side demo feature.
4. **Per-record authorization on the server.** The app currently syncs clinic-wide lists, so any signed-in staff member's browser receives all records.
5. **Stronger authentication:** two-factor sign-in, password reset by email, session revocation.
6. **Backups, retention and breach-response policies**, plus a documented risk assessment.
7. **Review by a qualified compliance professional.**

## Medical content
The diagnostic code set and condition guidance are reference material for software demonstration. They are not clinical decision support. Verify codes against the licensed CPT®, HCPCS and ICD-10-CM code books and payer rules before billing.

## Reporting a security issue
Contact the seller privately through the support channel listed on your purchase page.
