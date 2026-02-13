import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — email disabled");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
}

function buildHtml(title: string, message: string, linkUrl?: string): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const fullLink = linkUrl ? `${appUrl}${linkUrl}` : null;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background-color:#1e293b;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">PropTech</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#1e293b;font-size:18px;font-weight:600;">${title}</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">${message}</p>
          ${fullLink ? `<a href="${fullLink}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;">View Details</a>` : ""}
        </td></tr>
        <tr><td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated notification from PropTech Property Management.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Fire-and-forget email send. Never throws, never blocks.
 * Logs errors to console. Skips silently if Gmail env vars are not configured.
 */
export function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  linkUrl?: string
): void {
  const transport = getTransporter();
  if (!transport) return;

  const html = buildHtml(title, message, linkUrl);

  transport
    .sendMail({
      from: `"PropTech Notifications" <${process.env.GMAIL_USER}>`,
      to,
      subject: title,
      html,
    })
    .then(() => {
      console.log(`[email] Sent to ${to}: ${title}`);
    })
    .catch((err: unknown) => {
      console.error(`[email] Failed to send to ${to}:`, err);
    });
}
