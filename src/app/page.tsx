import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Workspace } from "@/app/workspace";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!process.env.DATABASE_URL) {
    return <main className="setup-wrap"><section className="setup-card"><p className="eyebrow">CALIBRATION MASTERS / SETUP</p><h1>Connect the database</h1><p className="subhead">The full-stack workspace is ready. Add the Postgres connection and Auth.js settings from <code>.env.example</code> to run it.</p><p className="subhead">Use a pooled Postgres URL for <code>DATABASE_URL</code> and a direct URL for <code>DIRECT_URL</code>. Your secrets stay in your local environment and Vercel settings.</p></section></main>;
  }
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return <Workspace user={{ id: session.user.id, name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role }} />;
}

