import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { createMockFormData } from "../helpers";

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$hashed$password$"),
    compare: vi.fn(),
  },
}));

// Mock rate limiter — always allow
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 10 }),
}));

// Mock next-auth AuthError
vi.mock("next-auth", () => {
  class AuthError extends Error {
    constructor(message?: string) {
      super(message ?? "Auth error");
      this.name = "AuthError";
      Object.setPrototypeOf(this, AuthError.prototype);
    }
  }
  return { AuthError };
});

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { rateLimit } from "@/lib/rate-limit";
import { loginAction, registerAction, logoutAction } from "@/actions/auth";

const mockPrisma = vi.mocked(prisma, true);
const mockSignIn = vi.mocked(signIn);
const mockSignOut = vi.mocked(signOut);
const mockRateLimit = vi.mocked(rateLimit);

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockReturnValue({ success: true, remaining: 10 });
  });

  describe("loginAction", () => {
    it("calls signIn with credentials", async () => {
      mockSignIn.mockResolvedValue(undefined as never);

      const formData = createMockFormData({
        email: "test@test.com",
        password: "Password1",
      });

      try {
        await loginAction(formData);
      } catch {
        // signIn may throw redirect
      }

      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@test.com",
        password: "Password1",
        redirectTo: "/dashboard",
      });
    });

    it("returns error on AuthError", async () => {
      mockSignIn.mockRejectedValue(new AuthError("CredentialsSignin"));

      const formData = createMockFormData({
        email: "bad@test.com",
        password: "wrong",
      });

      const result = await loginAction(formData);

      expect(result).toEqual({ error: "Invalid email or password" });
    });

    it("re-throws non-AuthError exceptions", async () => {
      const genericError = new Error("Network failure");
      mockSignIn.mockRejectedValue(genericError);

      const formData = createMockFormData({
        email: "test@test.com",
        password: "Password1",
      });

      await expect(loginAction(formData)).rejects.toThrow("Network failure");
    });

    it("blocks login when rate limited", async () => {
      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      const formData = createMockFormData({
        email: "test@test.com",
        password: "Password1",
      });

      const result = await loginAction(formData);

      expect(result).toEqual({ error: expect.stringContaining("Too many") });
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe("registerAction", () => {
    const validFormData = () =>
      createMockFormData({
        name: "John Doe",
        email: "john@test.com",
        password: "Password1",
        role: "TENANT",
      });

    it("creates user with hashed password on valid registration", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({} as never);
      mockSignIn.mockResolvedValue(undefined as never);

      try {
        await registerAction(validFormData());
      } catch {
        // signIn may throw redirect
      }

      expect(bcrypt.hash).toHaveBeenCalledWith("Password1", 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "john@test.com",
          password: "$hashed$password$",
          role: "TENANT",
        },
      });
    });

    it("returns validation error for short name", async () => {
      const formData = createMockFormData({
        name: "J",
        email: "j@test.com",
        password: "Password1",
        role: "TENANT",
      });

      const result = await registerAction(formData);

      expect(result).toEqual({ error: expect.stringContaining("2") });
    });

    it("returns validation error for invalid email", async () => {
      const formData = createMockFormData({
        name: "John",
        email: "notanemail",
        password: "Password1",
        role: "TENANT",
      });

      const result = await registerAction(formData);

      expect(result).toEqual({ error: expect.stringMatching(/email/i) });
    });

    it("returns validation error for weak password", async () => {
      const formData = createMockFormData({
        name: "John",
        email: "j@test.com",
        password: "short",
        role: "TENANT",
      });

      const result = await registerAction(formData);

      expect(result).toEqual({ error: expect.stringContaining("8") });
    });

    it("returns error for duplicate email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing",
      } as never);

      const result = await registerAction(validFormData());

      expect(result).toEqual({
        error: "An account with this email already exists",
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("hashes password with bcrypt and salt 12", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({} as never);
      mockSignIn.mockResolvedValue(undefined as never);

      try {
        await registerAction(validFormData());
      } catch {
        // redirect
      }

      expect(bcrypt.hash).toHaveBeenCalledWith("Password1", 12);
    });

    it("always registers as TENANT even if MANAGER role is submitted", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({} as never);
      mockSignIn.mockResolvedValue(undefined as never);

      const formData = createMockFormData({
        name: "Hacker",
        email: "hack@test.com",
        password: "Password1",
        role: "MANAGER",
      });

      try {
        await registerAction(formData);
      } catch {
        // redirect
      }

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: "TENANT" }),
      });
    });

    it("returns error if signIn fails after registration", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({} as never);
      mockSignIn.mockRejectedValue(new AuthError("SignIn failed"));

      const result = await registerAction(validFormData());

      expect(result).toEqual({
        error: "Account created but login failed. Please try logging in.",
      });
    });

    it("blocks registration when rate limited", async () => {
      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      const result = await registerAction(validFormData());

      expect(result).toEqual({ error: expect.stringContaining("Too many") });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("logoutAction", () => {
    it("calls signOut with redirect to /login", async () => {
      mockSignOut.mockResolvedValue(undefined as never);

      try {
        await logoutAction();
      } catch {
        // redirect
      }

      expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
    });
  });
});
