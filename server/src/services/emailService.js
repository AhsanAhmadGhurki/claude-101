import nodemailer from "nodemailer";
import { env, isProd } from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtp.host) return null; // Console-only fallback

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

// Generic send. In dev (no SMTP configured), logs to console and returns the
// payload so callers can surface the link in API responses for testing.
export async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log("\n📬 [email:dev]", { to, subject });
    console.log(text || html);
    console.log("");
    return { sent: false, devPreview: { to, subject, text } };
  }
  await t.sendMail({ from: env.smtp.from, to, subject, html, text });
  return { sent: true };
}

export function buildVerifyLink(token) {
  return `${env.clientOrigin}/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildResetLink(token) {
  return `${env.clientOrigin}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail(user, token) {
  const link = buildVerifyLink(token);
  const result = await sendEmail({
    to: user.email,
    subject: "Verify your email — Adventure AI",
    text: `Hi ${user.name},\n\nConfirm your email by visiting:\n${link}\n\nThis link expires in 24 hours.`,
    html: `<p>Hi ${user.name},</p><p>Confirm your email by visiting <a href="${link}">${link}</a>.</p><p>This link expires in 24 hours.</p>`,
  });
  // Only leak the link in dev; never in prod responses.
  return isProd ? { sent: result.sent } : { ...result, link };
}

export async function sendPasswordResetEmail(user, token) {
  const link = buildResetLink(token);
  const result = await sendEmail({
    to: user.email,
    subject: "Reset your password — Adventure AI",
    text: `Hi ${user.name},\n\nReset your password:\n${link}\n\nThis link expires in 15 minutes. If you didn't request this, ignore this email.`,
    html: `<p>Hi ${user.name},</p><p>Reset your password by visiting <a href="${link}">${link}</a>.</p><p>This link expires in 15 minutes. If you didn't request this, ignore this email.</p>`,
  });
  return isProd ? { sent: result.sent } : { ...result, link };
}
