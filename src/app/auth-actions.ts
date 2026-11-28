"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import {
  createAccount,
  requestPasswordReset,
  resetPassword,
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
      return { error: "Email or password is incorrect." };
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
  redirect("/sign-in?accountCreated=1");
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
