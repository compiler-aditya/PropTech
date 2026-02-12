"use server";

import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;

  const rl = rateLimit(`login:${email}`, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return { error: "Too many login attempts. Please try again in 15 minutes." };
  }

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const ip = "register"; // In production, extract from headers
  const rl = rateLimit(`register:${ip}`, { maxAttempts: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return { error: "Too many registration attempts. Please try again later." };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: "TENANT", // Self-registration is always TENANT
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but login failed. Please try logging in." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
