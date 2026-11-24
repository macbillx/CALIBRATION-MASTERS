import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Workspace } from "@/app/workspace";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return <main className="setup-wrap"><section className="setup-card"><p className="eyebrow">CALIBRATION MASTERS / SETUP</p><h1>Connect the database</h1><p className="subhead">The workspace is ready. Connect a PostgreSQL database in your deployment settings to continue.</p><p className="subhead">For Vercel Prisma Postgres, the app can use <code>CALI_DATABASE_URL_POOLED</code> and <code>CALI_DATABASE_URL</code> directly.</p></section></main>;
  }
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return <Workspace user={{ id: session.user.id, name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role }} />;
}
