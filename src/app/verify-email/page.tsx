import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VerifyEmailForm } from "@/app/auth-forms";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  if (!isDatabaseConfigured()) redirect("/");
  if ((await auth())?.user) redirect("/");
  const { email = "" } = await searchParams;
  return <main className="setup-wrap"><section className="setup-card sign-in-card"><p className="eyebrow">CALIBRATION MASTERS</p><h1>Verify your email</h1><p className="subhead">Enter the six-digit code sent to your email address. Codes expire after 10 minutes.</p><VerifyEmailForm email={email} /></section></main>;
}
