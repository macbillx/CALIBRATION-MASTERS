# Calibration Certificate Portal

A role-based portal for calibration certificate records, clients, approvals, and PDF certificates.

## Portal access

- Sign up with an email address and password, then sign in immediately. Email verification is not required.
- Sign in with email and password credentials. GitHub and third-party OAuth are not used for workspace access.
- New accounts receive the `technician` role. Administrators can assign `admin`, `technician`, or `approver` roles and are the only users allowed to delete accounts.
- Passwords are stored as bcrypt hashes. Password reset tokens are stored as one-way hashes, expire, and are rate-limited.
- Users can request a password reset link by email. Password resets invalidate existing sessions.
- The first administrator is provisioned during setup from the bootstrap email and password environment variables.

## Set up

1. Copy `.env.example` to `.env` and configure PostgreSQL, a unique `NEXTAUTH_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, and a bootstrap password. Passwords must be at least 12 characters and no more than 72 UTF-8 bytes.
2. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` to deliver password reset links.
3. Install dependencies and create the database tables and initial administrator:

   ```bash
   npm install
   npm run db:setup
   ```

4. Start the portal:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000` and create an account. `db:setup` creates the bootstrap administrator only if the database has no administrator; remove the bootstrap password from the environment after provisioning. To provision an administrator without importing the sample certificate records, use `npm run bootstrap-admin` with the production database URL and bootstrap credentials supplied through a secure operator environment. Do not commit `.env` or share passwords in project files.

## Deployment

Configure `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and the SMTP settings for password recovery in the hosting environment. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` only when provisioning the first administrator, then remove the bootstrap credentials. Apply the Prisma schema before serving traffic:

```bash
npx prisma db push
```

## Stack

- Next.js App Router and TypeScript
- PostgreSQL and Prisma
- Auth.js v5 Credentials provider with PostgreSQL-backed profiles and role-based access
- bcrypt password hashing
- `@react-pdf/renderer` certificate PDFs
