import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignUpForm } from "@/app/auth-forms";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (!isDatabaseConfigured()) redirect("/");
  if ((await auth())?.user) redirect("/");
  return <main className="setup-wrap"><section className="setup-card sign-in-card"><p className="eyebrow">CALIBRATION MASTERS</p><h1>Create an account</h1><p className="subhead">Create a profile and sign in right away.</p><SignUpForm /></section></main>;
}
