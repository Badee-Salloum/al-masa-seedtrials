"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      token: formData.get("token") || undefined,
      redirectTo: "/dashboard",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) return { error: "errors.invalidCredentials" };
    throw error; // redirect (NEXT_REDIRECT) must propagate
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
