"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import {
  createAccount,
  requestPasswordReset,
  resendVerificationCode,
  resetPassword,
  verifyEmail,
} from "@/lib/auth-service";

export type FormState = { error?: string; message?: string };

export async function signInAction(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email or password is incorrect, or the email address has not been verified." };
    }
    throw error;
  }
  return {};
}

export async function signUpAction(_state: FormState, formData: FormData): Promise<FormState> {
  let result;
  try {
    result = await createAccount({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch (error) {
    console.error("Account creation failed", error);
    return { error: "Could not create the account. Please try again later." };
  }
  if ("error" in result) return { error: result.error };
  redirect(`/verify-email?email=${encodeURIComponent(result.email)}`);
}

export async function verifyEmailAction(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const verified = await verifyEmail({
      email: formData.get("email"),
      code: formData.get("code"),
    });
    if (!verified) return { error: "That verification code is invalid or expired." };
  } catch (error) {
    console.error("Email verification failed", error);
    return { error: "Could not verify the email address. Please try again." };
  }
  redirect("/sign-in?verified=1");
}

export async function resendVerificationAction(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    return await resendVerificationCode(formData.get("email"));
  } catch (error) {
    console.error("Verification code resend failed", error);
    if (error instanceof Error && (error.message.includes("SMTP configuration") || error.message.includes("NEXTAUTH_URL"))) {
      return { error: error.message };
    }
    return { error: "Could not send a new verification code. Please try again later." };
  }
}

export async function requestPasswordResetAction(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const result = await requestPasswordReset(formData.get("email"));
    return result;
  } catch (error) {
    console.error("Password reset request failed", error);
    if (error instanceof Error && error.message.includes("SMTP configuration")) {
      return { error: error.message };
    }
    return { error: "Could not request a password reset. Please try again later." };
  }
}

export async function resetPasswordAction(_state: FormState, formData: FormData): Promise<FormState> {
  let result;
  try {
    result = await resetPassword({
      token: formData.get("token"),
      password: formData.get("password"),
    });
  } catch (error) {
    console.error("Password reset failed", error);
    return { error: "Could not reset the password. Request a new reset link and try again." };
  }
  if ("error" in result) return { error: result.error };
  redirect("/sign-in?passwordReset=1");
}
