import crypto from "node:crypto";
import { Otp } from "../models/Otp.js";
import { sha256 } from "../utils/cryptoTokens.js";
import { ApiError } from "../utils/ApiError.js";

// 10-minute validity. Spec asked for 5–10 — picked 10 to cover email delivery
// latency without forcing a re-request just because the inbox lagged.
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_TTL_MINUTES = OTP_TTL_MS / 60_000;

// Wrong-code attempts allowed before the OTP is rejected outright. Combined
// with the 6-digit space (1M codes) this caps brute-force at 5/1M per OTP.
const MAX_ATTEMPTS = 5;

// Per-(user, purpose) resend cooldown. Stops an attacker (or impatient user)
// from triggering an email per second. Lower than the express-rate-limit
// per-IP throttle in routes, but bound to the *recipient* not the requester
// — protects victim mailboxes from spam during account-takeover attempts.
const RESEND_COOLDOWN_MS = 60 * 1000;

// Cryptographically secure 6-digit numeric code. Math.random would be
// predictable; crypto.randomInt is the explicit secure path.
function generateCode() {
  // randomInt is exclusive of the upper bound — yields 0…999_999.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Issue an OTP for (user, purpose). Invalidates any previous active OTP for
// the same pair so the email's "current" code is the only one that works.
//
// Returns { code, expiresAt }. The caller is responsible for delivering the
// code (email in prod, dev log + API response in dev). Never log/return
// `code` from a production response — that's enforced at the controller
// layer, not here.
export async function issueOtp({ user, purpose }) {
  const recent = await Otp.findOne({
    user: user._id,
    purpose,
    usedAt: null,
  }).sort({ createdAt: -1 });

  if (recent) {
    const sinceMs = Date.now() - recent.createdAt.getTime();
    if (sinceMs < RESEND_COOLDOWN_MS) {
      throw new ApiError(429, "Please wait before requesting another code.", {
        code: "OTP_COOLDOWN",
        details: { retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - sinceMs) / 1000) },
      });
    }
  }

  // Burn previous active OTPs for this user/purpose so a stale one can't be
  // used after a resend.
  await Otp.updateMany(
    { user: user._id, purpose, usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await Otp.create({
    user: user._id,
    purpose,
    codeHash: sha256(code),
    expiresAt,
  });

  return { code, expiresAt };
}

// Validate a (user, purpose, code) and consume the OTP on success.
// Throws ApiError on every failure mode (format, missing, expired,
// over-attempts, wrong). On success the row's usedAt is set so it can't be
// replayed.
export async function consumeOtp({ user, purpose, code }) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    throw new ApiError(400, "Enter the 6-digit code from your email.", {
      code: "OTP_FORMAT",
    });
  }

  const record = await Otp.findOne({
    user: user._id,
    purpose,
    usedAt: null,
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new ApiError(400, "No active code. Request a new one.", {
      code: "OTP_NONE",
    });
  }

  if (record.expiresAt <= new Date()) {
    throw new ApiError(400, "This code has expired. Request a new one.", {
      code: "OTP_EXPIRED",
    });
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    // Lock the OTP so subsequent attempts don't even hit the hash compare.
    record.usedAt = new Date();
    await record.save();
    throw new ApiError(429, "Too many wrong attempts. Request a new code.", {
      code: "OTP_LOCKED",
    });
  }

  if (sha256(code) !== record.codeHash) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, "Incorrect code. Try again.", {
      code: "OTP_INCORRECT",
      details: { attemptsRemaining: MAX_ATTEMPTS - record.attempts },
    });
  }

  record.usedAt = new Date();
  await record.save();
  return true;
}
