import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!process.env.DATABASE_URL) redirect("/");
  const session = await auth();
  if (session?.user) redirect("/");
  const { error } = await searchParams;
  return <main className="setup-wrap"><section className="setup-card sign-in-card"><p className="eyebrow">CALIBRATION MASTERS</p><h1>Certificate workspace</h1><p className="subhead">Sign in with your approved GitHub account to open the register.</p>{error && <p className="app-error">Your account could not sign in. Confirm it is on the workspace allowlist.</p>}<form action={async () => { "use server"; await signIn("github", { redirectTo: "/" }); }}><button className="button button-primary" type="submit">Continue with GitHub</button></form><p className="subhead" style={{ marginTop: 18 }}>Access is limited to users listed in the workspace environment settings.</p></section></main>;
}

