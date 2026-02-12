import { describe, it, expect } from "vitest";
import { createTicketSchema } from "@/lib/validations/ticket";

describe("createTicketSchema", () => {
  const validData = {
    title: "Leaking faucet in kitchen",
    description: "The kitchen faucet has been dripping for two days",
    propertyId: "prop-1",
    category: "PLUMBING" as const,
    priority: "MEDIUM" as const,
  };

  it("accepts valid ticket with all fields", () => {
    const result = createTicketSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("defaults priority to MEDIUM when omitted", () => {
    const { priority, ...withoutPriority } = validData;
    const result = createTicketSchema.safeParse(withoutPriority);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("MEDIUM");
    }
  });

  it("unitNumber is optional", () => {
    const result = createTicketSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const withUnit = createTicketSchema.safeParse({
      ...validData,
      unitNumber: "A-101",
    });
    expect(withUnit.success).toBe(true);
  });

  it("rejects title shorter than 3 characters", () => {
    const result = createTicketSchema.safeParse({ ...validData, title: "ab" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("3");
    }
  });

  it("accepts title exactly 3 characters", () => {
    const result = createTicketSchema.safeParse({ ...validData, title: "abc" });
    expect(result.success).toBe(true);
  });

  it("rejects title longer than 200 characters", () => {
    const result = createTicketSchema.safeParse({
      ...validData,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title exactly 200 characters", () => {
    const result = createTicketSchema.safeParse({
      ...validData,
      title: "a".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("rejects description shorter than 10 characters", () => {
    const result = createTicketSchema.safeParse({
      ...validData,
      description: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("10");
    }
  });

  it("accepts description exactly 10 characters", () => {
    const result = createTicketSchema.safeParse({
      ...validData,
      description: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty propertyId", () => {
    const result = createTicketSchema.safeParse({
      ...validData,
      propertyId: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    const categories = [
      "PLUMBING",
      "ELECTRICAL",
      "HVAC",
      "APPLIANCE",
      "STRUCTURAL",
      "PEST_CONTROL",
      "OTHER",
    ];
    for (const category of categories) {
      const result = createTicketSchema.safeParse({ ...validData, category });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid category", () => {
    const result = createTicketSchema.safeParse({
      ...validData,
      category: "UNKNOWN",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid priorities", () => {
    const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    for (const priority of priorities) {
      const result = createTicketSchema.safeParse({ ...validData, priority });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid priority", () => {
    const result = createTicketSchema.safeParse({
      ...validData,
      priority: "CRITICAL",
    });
    expect(result.success).toBe(false);
  });
});
