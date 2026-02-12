import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@test.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts any non-empty password for login", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email field", () => {
    const result = loginSchema.safeParse({ password: "Password1" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password field", () => {
    const result = loginSchema.safeParse({ email: "a@b.com" });
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    name: "John Doe",
    email: "john@test.com",
    password: "Password1",
    role: "TENANT",
  };

  it("accepts valid registration with all fields", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("defaults role to TENANT when omitted", () => {
    const { role, ...withoutRole } = validData;
    const result = registerSchema.safeParse(withoutRole);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("TENANT");
    }
  });

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...validData, name: "J" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("2");
    }
  });

  it("accepts name exactly 2 characters", () => {
    const result = registerSchema.safeParse({ ...validData, name: "Jo" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...validData, email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Pass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("8");
    }
  });

  it("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "password1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("uppercase");
    }
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Passwordx",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("number");
    }
  });

  it("accepts MANAGER role", () => {
    const result = registerSchema.safeParse({
      ...validData,
      role: "MANAGER",
    });
    expect(result.success).toBe(true);
  });

  it("accepts TECHNICIAN role", () => {
    const result = registerSchema.safeParse({
      ...validData,
      role: "TECHNICIAN",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = registerSchema.safeParse({ ...validData, role: "ADMIN" });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
  });
});
