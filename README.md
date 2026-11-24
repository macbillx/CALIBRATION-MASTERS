# Calibration Certificate Portal

A role-based portal for calibration certificate records, clients, approvals, and PDF certificates.

## Portal access

- Sign in with a username and password.
- Administrators create accounts and assign `admin`, `technician`, or `approver` roles.
- Passwords are stored as bcrypt hashes. There are no public self-registration links.
- Administrators can deactivate accounts or reset a password without removing its audit history. Account owners can change their password from **My account**.
- The administrator access log records successful sign-ins, sign-outs, and rejected sign-in attempts, with the account name and UTC time.
- Certificate and account actions are recorded in the audit log.

## Set up

1. Copy `.env.example` to `.env` and enter a PostgreSQL connection string, a unique `NEXTAUTH_SECRET`, and the first administrator username and password. Passwords must be at least 12 characters and no more than 72 bytes.
2. Install dependencies and create the database tables and initial administrator:

   ```bash
   npm install
   npm run db:setup
   ```

3. Start the portal:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`. After the first administrator is set up, create other accounts from **User accounts**. Do not commit `.env` or share passwords in the project files.

## Deployment

Configure `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` in the hosting environment. Set `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_PASSWORD` only when provisioning the first administrator, then remove the bootstrap password. Apply the Prisma schema before serving traffic:

```bash
npx prisma db push
```

## Stack

- Next.js App Router and TypeScript
- PostgreSQL and Prisma
- Auth.js / NextAuth Credentials provider with role-based access
- bcrypt password hashing
- `@react-pdf/renderer` certificate PDFs
