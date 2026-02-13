import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-123" });

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

// Unmock @/lib/email for this test file (setup.ts mocks it globally)
vi.unmock("@/lib/email");

describe("sendNotificationEmail", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.GMAIL_USER = "test@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "test-app-password";
    process.env.APP_URL = "https://proptech.example.com";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("sends email with correct parameters", async () => {
    const { sendNotificationEmail } = await import("@/lib/email");

    sendNotificationEmail(
      "tenant@example.com",
      "Ticket Assigned",
      "Your ticket has been assigned",
      "/tickets/abc123"
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "tenant@example.com",
        subject: "Ticket Assigned",
        from: expect.stringContaining("test@gmail.com"),
        html: expect.stringContaining("Your ticket has been assigned"),
      })
    );
  });

  it("includes full link in HTML when linkUrl provided", async () => {
    const { sendNotificationEmail } = await import("@/lib/email");

    sendNotificationEmail(
      "tenant@example.com",
      "Test",
      "Test message",
      "/tickets/abc123"
    );

    await new Promise((r) => setTimeout(r, 50));

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain("https://proptech.example.com/tickets/abc123");
    expect(html).toContain("View Details");
  });

  it("omits link button when no linkUrl provided", async () => {
    const { sendNotificationEmail } = await import("@/lib/email");

    sendNotificationEmail("tenant@example.com", "Test", "Test message");

    await new Promise((r) => setTimeout(r, 50));

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).not.toContain("View Details");
  });

  it("does not send when env vars are missing", async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const { sendNotificationEmail } = await import("@/lib/email");

    sendNotificationEmail("tenant@example.com", "Test", "Test message");

    await new Promise((r) => setTimeout(r, 50));

    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("does not throw when sendMail fails", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP error"));
    const { sendNotificationEmail } = await import("@/lib/email");

    expect(() =>
      sendNotificationEmail("tenant@example.com", "Test", "Test message")
    ).not.toThrow();
  });
});
