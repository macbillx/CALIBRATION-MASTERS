# Calibration Masters

Full-stack certificate workspace built with Next.js, TypeScript, Auth.js, PostgreSQL, Prisma, and server-generated PDFs.

## Run locally

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env` and set the database and GitHub OAuth values.
3. Install packages with `npm install`.
4. Apply the database schema with `npm run db:deploy` (or `npm run db:migrate` for local development).
5. Import the workbook seed data with `npm run db:seed`.
6. Start the app with `npm run dev` and open `http://localhost:3000`.

The initial data import reads the existing `seed.js` and `quality-seed.js` files and upserts by certificate number. It imports the ten populated certificate records and source rows 19 and 20. The import is repeatable and does not overwrite unrelated records.

## Authentication and roles

Create a GitHub OAuth App. Set its callback URL to `http://localhost:3000/api/auth/callback/github` locally and your deployed host's `/api/auth/callback/github` in production. Set `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and a strong `AUTH_SECRET`.

Restrict access with comma-separated email lists in `AUTH_ALLOWED_EMAILS`. Assign the first administrator with `AUTH_ADMIN_EMAIL` (or `AUTH_ADMIN_EMAILS`); set technician and approver email lists with `AUTH_TECHNICIAN_EMAILS` and `AUTH_APPROVER_EMAILS`. Admins can change member roles in Team Access.

## Database

Use a pooled PostgreSQL URL as `DATABASE_URL` and a direct PostgreSQL URL as `DIRECT_URL`. Prisma migrations are in `prisma/migrations`. Never commit `.env` or production credentials.

## Vercel deployment

Import `macbillx/CALIBRATION-MASTERS` into Vercel and configure the same environment variables for Production and Preview as needed. Set `DATABASE_URL` and `DIRECT_URL`, then run the seed import once against the intended production database. GitHub Pages can host only the old static preview; the authenticated workspace and API routes require the Next.js deployment.

## Data migration and backups

The app supports importing an exported JSON backup into the shared database and exporting a JSON backup from the workspace. The original workbook remains the authoritative source until its records are checked in the new database.

