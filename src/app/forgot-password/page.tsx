import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/app/auth-forms";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  if (!isDatabaseConfigured()) redirect("/");
  if ((await auth())?.user) redirect("/");
  return <main className="setup-wrap"><section className="setup-card sign-in-card"><p className="eyebrow">CALIBRATION MASTERS</p><h1>Reset your password</h1><p className="subhead">Enter your email address and we will send a reset link if an account is registered.</p><ForgotPasswordForm /></section></main>;
}
