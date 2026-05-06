import mongoose from "mongoose";

// 6-digit email OTPs for signup verification, password reset, etc.
//
// Stored hashed (SHA-256) — a DB leak doesn't reveal valid codes. Single-use:
// once usedAt is set the code can't be replayed. Attempts is incremented on
// each wrong submission and capped (see otpService) so an attacker can't
// brute-force the 1-in-1,000,000 space. The TTL index auto-deletes rows
// shortly after expiresAt so the collection doesn't grow unbounded.

const PURPOSES = ["email_verification", "password_reset", "login_verification"];

const otpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // One user can have several active OTPs concurrently (e.g. one for
    // verification, one for password reset). Bind by purpose.
    purpose: { type: String, enum: PURPOSES, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// MongoDB TTL: documents auto-delete shortly after expiresAt. Used + expired
// rows fall out automatically — no cron job needed.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Composite query support: "find the most recent active OTP for this user
// and purpose" is the dominant pattern.
otpSchema.index({ user: 1, purpose: 1, createdAt: -1 });

export const OTP_PURPOSES = Object.freeze({
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset",
  LOGIN_VERIFICATION: "login_verification",
});

export const Otp = mongoose.model("Otp", otpSchema);
