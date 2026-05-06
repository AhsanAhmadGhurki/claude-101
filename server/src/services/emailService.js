import nodemailer from "nodemailer";
import { env, isProd } from "../config/env.js";
import { OTP_TTL_MINUTES } from "./otpService.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtp.host) return null; // Console-only fallback (dev w/o SMTP)

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

// Generic send. In dev (no SMTP configured), logs the payload to console so
// the developer can see what would have been sent. The OTP itself is also
// returned to the controller via sendOtpEmail's return value so the dev
// API response can surface it — never call this directly from a prod path
// that needs to return content to the client.
export async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log("\n📬 [email:dev]", { to, subject });
    console.log(text || html);
    console.log("");
    return { sent: false };
  }
  await t.sendMail({ from: env.smtp.from, to, subject, html, text });
  return { sent: true };
}

const PURPOSE_COPY = {
  email_verification: {
    subject: "Verify your email — Adventure AI",
    headline: "Verify your email",
    intro: "Use this 6-digit code to confirm your email address.",
    safety:
      "If you didn't sign up for Adventure AI, you can safely ignore this email.",
  },
  password_reset: {
    subject: "Reset your password — Adventure AI",
    headline: "Password reset code",
    intro: "Use this 6-digit code to confirm your password reset.",
    safety:
      "If you didn't request a reset, ignore this email — your password is unchanged.",
  },
};

function renderHtml({ headline, intro, code, ttl, name, safety }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding:28px 28px 8px;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#0a8c5b;font-weight:700;">Adventure AI</div>
          <h1 style="font-size:22px;line-height:1.3;margin:8px 0 16px;color:#111;">${headline}</h1>
          <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 24px;">Hi ${escapeHtml(name)}, ${intro}</p>
          <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:32px;letter-spacing:10px;text-align:center;padding:18px;background:#f5f5f7;border-radius:12px;font-weight:700;color:#111;">${code}</div>
          <p style="font-size:13px;line-height:1.6;color:#666;margin:18px 0 4px;">This code expires in <strong>${ttl} minutes</strong>.</p>
          <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 24px;">${safety}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 24px;border-top:1px solid #eee;">
          <p style="font-size:11px;line-height:1.5;color:#999;margin:0;">Adventure AI · Never share this code with anyone, including support staff.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText({ headline, intro, code, ttl, name, safety }) {
  return `${headline}

Hi ${name},

${intro}

Your code: ${code}
This code expires in ${ttl} minutes.

${safety}

— Adventure AI
Never share this code with anyone, including support staff.`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Public API: send a 6-digit OTP for the given purpose.
//
// Return value depends on environment:
// - Production: { sent: boolean } only. The code is never returned.
// - Development: includes { code } so the controller can surface it via the
//   dev-only `devOtp` response field. Also logged to console regardless of
//   whether SMTP is configured.
export async function sendOtpEmail(user, code, purpose) {
  const copy = PURPOSE_COPY[purpose] ?? PURPOSE_COPY.email_verification;
  const params = {
    headline: copy.headline,
    intro: copy.intro,
    safety: copy.safety,
    code,
    ttl: OTP_TTL_MINUTES,
    name: user.name,
  };

  const result = await sendEmail({
    to: user.email,
    subject: copy.subject,
    html: renderHtml(params),
    text: renderText(params),
  });

  if (!isProd) {
    console.log(`🔐 [otp:dev] purpose=${purpose} email=${user.email} code=${code}`);
    return { ...result, code };
  }
  return { sent: result.sent };
}
