import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "@/app/auth-forms";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ verified?: string; passwordReset?: string }> }) {
  if (!isDatabaseConfigured()) redirect("/");
  const session = await auth();
  if (session?.user) redirect("/");
  const params = await searchParams;
  return <main className="setup-wrap"><section className="setup-card sign-in-card"><p className="eyebrow">CALIBRATION MASTERS</p><h1>Certificate workspace</h1><p className="subhead">Sign in with your verified email and password.</p>{params.verified && <p className="auth-success" role="status">Email verified. You can now sign in.</p>}{params.passwordReset && <p className="auth-success" role="status">Password reset. You can now sign in.</p>}<SignInForm /></section></main>;
}
