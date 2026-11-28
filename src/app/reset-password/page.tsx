import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ResetPasswordForm } from "@/app/auth-forms";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (!isDatabaseConfigured()) redirect("/");
  if ((await auth())?.user) redirect("/");
  const { token = "" } = await searchParams;
  return <main className="setup-wrap"><section className="setup-card sign-in-card"><p className="eyebrow">CALIBRATION MASTERS</p><h1>Choose a new password</h1><p className="subhead">The reset link expires 30 minutes after it is sent.</p><ResetPasswordForm token={token} /></section></main>;
}
