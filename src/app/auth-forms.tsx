"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
  type FormState,
} from "@/app/auth-actions";

const initialState: FormState = {};

function SubmitButton({ children, pendingText, className }: { children: string; pendingText: string; className: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending} aria-busy={pending}>{pending ? pendingText : children}</button>;
}

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="app-error auth-feedback" role="alert">{state.error}</p>;
  if (state.message) return <p className="auth-success" role="status">{state.message}</p>;
  return null;
}

export function SignInForm() {
  const [state, action] = useFormState(signInAction, initialState);
  return <>
    <form className="auth-form" action={action}>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <Feedback state={state} />
      <SubmitButton className="button button-primary" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
    <div className="auth-links"><Link href="/sign-up">Create an account</Link><Link href="/forgot-password">Forgot password?</Link></div>
  </>;
}

export function SignUpForm() {
  const [state, action] = useFormState(signUpAction, initialState);
  return <>
    <form className="auth-form" action={action}>
      <label>Name<input name="name" type="text" autoComplete="name" maxLength={100} required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} required /><small>Use at least 12 characters (maximum 72 UTF-8 bytes).</small></label>
      <Feedback state={state} />
      <SubmitButton className="button button-primary" pendingText="Creating account…">Create account</SubmitButton>
    </form>
    <p className="auth-links"><Link href="/sign-in">Back to sign in</Link></p>
  </>;
}

export function ForgotPasswordForm() {
  const [state, action] = useFormState(requestPasswordResetAction, initialState);
  return <>
    <form className="auth-form" action={action}>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <Feedback state={state} />
      <SubmitButton className="button button-primary" pendingText="Sending…">Send reset link</SubmitButton>
    </form>
    <p className="auth-links"><Link href="/sign-in">Back to sign in</Link></p>
  </>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPasswordAction, initialState);
  return <>
    <form className="auth-form" action={action}>
      <input type="hidden" name="token" value={token} />
      <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /><small>Use at least 12 characters (maximum 72 UTF-8 bytes).</small></label>
      <Feedback state={state} />
      <SubmitButton className="button button-primary" pendingText="Resetting…">Reset password</SubmitButton>
    </form>
  </>;
}
