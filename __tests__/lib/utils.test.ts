import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatDate, formatDateTime, timeAgo, formatFileSize } from "@/lib/utils";

describe("cn", () => {
  it("merges multiple class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "text-sm")).toBe("base text-sm");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-03-15T00:00:00Z"));
    expect(result).toContain("Mar");
    expect(result).toContain("2024");
  });

  it("formats a date string", () => {
    const result = formatDate("2024-12-25T00:00:00Z");
    expect(result).toContain("Dec");
    expect(result).toContain("25");
    expect(result).toContain("2024");
  });

  it("formats an ISO string", () => {
    const result = formatDate("2024-06-01T12:00:00Z");
    expect(result).toContain("2024");
  });

  it("handles epoch date", () => {
    const result = formatDate(new Date(0));
    expect(result).toContain("1970");
  });
});

describe("formatDateTime", () => {
  it("includes time component", () => {
    const result = formatDateTime("2024-03-15T14:30:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("2024");
    // Should contain some time representation
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats a Date object with time", () => {
    const result = formatDateTime(new Date("2024-06-01T09:15:00Z"));
    expect(result).toContain("2024");
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("handles midnight", () => {
    const result = formatDateTime("2024-01-01T00:00:00Z");
    expect(result).toContain("2024");
  });
});

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for < 60 seconds ago', () => {
    const date = new Date("2024-06-15T11:59:30Z"); // 30s ago
    expect(timeAgo(date)).toBe("just now");
  });

  it('returns "just now" for 0 seconds ago', () => {
    const date = new Date("2024-06-15T12:00:00Z");
    expect(timeAgo(date)).toBe("just now");
  });

  it("returns minutes for < 60 minutes ago", () => {
    const date = new Date("2024-06-15T11:55:00Z"); // 5m ago
    expect(timeAgo(date)).toBe("5m ago");
  });

  it('returns "1m ago" at exactly 60 seconds', () => {
    const date = new Date("2024-06-15T11:59:00Z"); // 60s ago
    expect(timeAgo(date)).toBe("1m ago");
  });

  it("returns hours for < 24 hours ago", () => {
    const date = new Date("2024-06-15T09:00:00Z"); // 3h ago
    expect(timeAgo(date)).toBe("3h ago");
  });

  it("returns days for < 7 days ago", () => {
    const date = new Date("2024-06-13T12:00:00Z"); // 2d ago
    expect(timeAgo(date)).toBe("2d ago");
  });

  it("falls back to formatDate for >= 7 days ago", () => {
    const date = new Date("2024-06-05T12:00:00Z"); // 10d ago
    const result = timeAgo(date);
    expect(result).not.toContain("ago");
    expect(result).toContain("2024");
  });

  // Boundary tests
  it('exactly 59 seconds is "just now"', () => {
    const date = new Date("2024-06-15T11:59:01Z"); // 59s ago
    expect(timeAgo(date)).toBe("just now");
  });

  it("exactly 59 minutes shows minutes", () => {
    const date = new Date("2024-06-15T11:01:00Z"); // 59m ago
    expect(timeAgo(date)).toBe("59m ago");
  });

  it("exactly 23 hours shows hours", () => {
    const date = new Date("2024-06-14T13:00:00Z"); // 23h ago
    expect(timeAgo(date)).toBe("23h ago");
  });

  it("exactly 6 days shows days", () => {
    const date = new Date("2024-06-09T12:00:00Z"); // 6d ago
    expect(timeAgo(date)).toBe("6d ago");
  });

  it("exactly 7 days falls back to formatDate", () => {
    const date = new Date("2024-06-08T12:00:00Z"); // 7d ago
    const result = timeAgo(date);
    expect(result).not.toContain("d ago");
  });
});

describe("formatFileSize", () => {
  it("returns '0 B' for zero bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats small bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats exactly 1 KB", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats fractional KB", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats exactly 1 MB", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
  });

  it("formats large MB value", () => {
    expect(formatFileSize(5242880)).toBe("5 MB");
  });

  it("formats 1 GB", () => {
    expect(formatFileSize(1073741824)).toBe("1 GB");
  });

  it("formats 1 byte", () => {
    expect(formatFileSize(1)).toBe("1 B");
  });
});
