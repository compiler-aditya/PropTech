import { describe, it, expect } from "vitest";
import {
  VALID_TRANSITIONS,
  TICKET_STATUS,
  TICKET_PRIORITY,
  MAINTENANCE_CATEGORY,
  ROLES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  ROLE_LABELS,
  UPLOAD,
} from "@/lib/constants";

describe("VALID_TRANSITIONS", () => {
  it("OPEN can transition to ASSIGNED", () => {
    expect(VALID_TRANSITIONS["OPEN"]).toContain("ASSIGNED");
  });

  it("OPEN cannot transition to IN_PROGRESS", () => {
    expect(VALID_TRANSITIONS["OPEN"]).not.toContain("IN_PROGRESS");
  });

  it("OPEN cannot transition to COMPLETED", () => {
    expect(VALID_TRANSITIONS["OPEN"]).not.toContain("COMPLETED");
  });

  it("ASSIGNED can transition to IN_PROGRESS", () => {
    expect(VALID_TRANSITIONS["ASSIGNED"]).toContain("IN_PROGRESS");
  });

  it("ASSIGNED can transition back to OPEN", () => {
    expect(VALID_TRANSITIONS["ASSIGNED"]).toContain("OPEN");
  });

  it("IN_PROGRESS can transition to COMPLETED", () => {
    expect(VALID_TRANSITIONS["IN_PROGRESS"]).toContain("COMPLETED");
  });

  it("IN_PROGRESS can transition back to ASSIGNED", () => {
    expect(VALID_TRANSITIONS["IN_PROGRESS"]).toContain("ASSIGNED");
  });

  it("COMPLETED can reopen to IN_PROGRESS", () => {
    expect(VALID_TRANSITIONS["COMPLETED"]).toContain("IN_PROGRESS");
  });

  it("COMPLETED cannot go back to OPEN", () => {
    expect(VALID_TRANSITIONS["COMPLETED"]).not.toContain("OPEN");
  });

  it("every status has defined transitions", () => {
    for (const status of Object.values(TICKET_STATUS)) {
      expect(VALID_TRANSITIONS[status]).toBeDefined();
      expect(Array.isArray(VALID_TRANSITIONS[status])).toBe(true);
    }
  });
});

describe("Label coverage", () => {
  it("STATUS_LABELS covers all TICKET_STATUS values", () => {
    for (const status of Object.values(TICKET_STATUS)) {
      expect(STATUS_LABELS[status]).toBeDefined();
      expect(typeof STATUS_LABELS[status]).toBe("string");
    }
  });

  it("PRIORITY_LABELS covers all TICKET_PRIORITY values", () => {
    for (const priority of Object.values(TICKET_PRIORITY)) {
      expect(PRIORITY_LABELS[priority]).toBeDefined();
      expect(typeof PRIORITY_LABELS[priority]).toBe("string");
    }
  });

  it("CATEGORY_LABELS covers all MAINTENANCE_CATEGORY values", () => {
    for (const category of Object.values(MAINTENANCE_CATEGORY)) {
      expect(CATEGORY_LABELS[category]).toBeDefined();
      expect(typeof CATEGORY_LABELS[category]).toBe("string");
    }
  });

  it("ROLE_LABELS covers all ROLES values", () => {
    for (const role of Object.values(ROLES)) {
      expect(ROLE_LABELS[role]).toBeDefined();
      expect(typeof ROLE_LABELS[role]).toBe("string");
    }
  });
});

describe("UPLOAD constants", () => {
  it("has expected constraints", () => {
    expect(UPLOAD.MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(UPLOAD.MAX_FILES_PER_TICKET).toBe(5);
    expect(UPLOAD.ALLOWED_TYPES).toHaveLength(4);
    expect(UPLOAD.ALLOWED_TYPES).toContain("image/jpeg");
    expect(UPLOAD.ALLOWED_TYPES).toContain("image/png");
    expect(UPLOAD.ALLOWED_TYPES).toContain("image/webp");
    expect(UPLOAD.ALLOWED_TYPES).toContain("image/gif");
  });
});
