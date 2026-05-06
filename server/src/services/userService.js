import validator from "validator";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../utils/password.js";
import { revokeAllSessions } from "./authService.js";
import { issueOtp, consumeOtp } from "./otpService.js";
import { OTP_PURPOSES } from "../models/Otp.js";
import { sendOtpEmail } from "./emailService.js";
import { env } from "../config/env.js";

function validateSignupInput({ name, email, password }) {
  const details = {};
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    details.name = "Name must be at least 2 characters";
  }
  if (!email || !validator.isEmail(String(email))) {
    details.email = "Enter a valid email address";
  }
  const pwErr = validatePasswordStrength(password);
  if (pwErr) details.password = pwErr;
  return details;
}

function normalizeEmail(email) {
  return String(email ?? "").toLowerCase().trim();
}

export async function createUser({ name, email, password }) {
  const details = validateSignupInput({ name, email, password });
  if (Object.keys(details).length) {
    throw new ApiError(400, "Validation failed", { details });
  }

  const normalizedEmail = normalizeEmail(email);
  if (await User.findOne({ email: normalizedEmail })) {
    throw new ApiError(409, "Email already in use", {
      details: { email: "Email already in use" },
    });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  // Issue + dispatch the email-verification OTP. emailResult.code is only
  // populated in dev — production never sees it.
  const { code } = await issueOtp({ user, purpose: OTP_PURPOSES.EMAIL_VERIFICATION });
  const emailResult = await sendOtpEmail(user, code, OTP_PURPOSES.EMAIL_VERIFICATION);

  return { user, emailResult };
}

export async function authenticate({ email, password }) {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    "+passwordHash"
  );

  // Same error for either failure mode — don't leak which.
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!ok) {
    throw new ApiError(401, "Invalid email or password", {
      code: "BAD_CREDENTIALS",
    });
  }

  if (env.requireEmailVerification && !user.isVerified) {
    throw new ApiError(403, "Please verify your email before signing in", {
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  return user;
}

// Verify a 6-digit email OTP. The user is identified by the email in the
// payload, not by a pre-existing session — verification can happen from any
// browser/device.
export async function verifyEmailOtp({ email, code }) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  // Generic error so we don't reveal whether the email exists. consumeOtp
  // would also throw OTP_NONE here, but we want a single shape.
  if (!user) {
    throw new ApiError(400, "Incorrect code or email.", { code: "OTP_INCORRECT" });
  }

  await consumeOtp({
    user,
    purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
    code,
  });

  if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }
  return user;
}

// Re-issue a verification OTP. Always responds 200 from the controller (no
// account enumeration), so we silently no-op for unknown / already-verified
// users.
export async function requestVerificationOtp(email) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user || user.isVerified) return { sent: false };

  const { code } = await issueOtp({ user, purpose: OTP_PURPOSES.EMAIL_VERIFICATION });
  return sendOtpEmail(user, code, OTP_PURPOSES.EMAIL_VERIFICATION);
}

// Issue a password-reset OTP. Like verification: silent no-op for unknown
// emails so we don't leak account existence.
export async function startPasswordReset(email) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) return { sent: false };

  const { code } = await issueOtp({ user, purpose: OTP_PURPOSES.PASSWORD_RESET });
  return sendOtpEmail(user, code, OTP_PURPOSES.PASSWORD_RESET);
}

// Consume a password-reset OTP and apply the new password. All sessions are
// revoked server-side so any other device with an old refresh token is
// kicked.
export async function completePasswordReset({ email, code, password }) {
  const pwErr = validatePasswordStrength(password);
  if (pwErr) {
    throw new ApiError(400, "Validation failed", {
      details: { password: pwErr },
    });
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    "+passwordHash"
  );
  if (!user) {
    throw new ApiError(400, "Incorrect code or email.", { code: "OTP_INCORRECT" });
  }

  await consumeOtp({
    user,
    purpose: OTP_PURPOSES.PASSWORD_RESET,
    code,
  });

  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = new Date();
  await user.save();
  await revokeAllSessions(user._id);
  return user;
}

export async function updateProfile(user, { name, email }) {
  const details = {};
  if (name != null) {
    const trimmed = String(name).trim();
    if (trimmed.length < 2) details.name = "Name must be at least 2 characters";
    else user.name = trimmed;
  }
  if (email != null) {
    const normalized = normalizeEmail(email);
    if (!validator.isEmail(normalized)) {
      details.email = "Enter a valid email address";
    } else if (normalized !== user.email) {
      const taken = await User.findOne({ email: normalized });
      if (taken) {
        details.email = "Email already in use";
      } else {
        user.email = normalized;
        // Email changed → require re-verification with a fresh OTP.
        user.isVerified = false;
        const { code } = await issueOtp({
          user,
          purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
        });
        await sendOtpEmail(user, code, OTP_PURPOSES.EMAIL_VERIFICATION);
      }
    }
  }
  if (Object.keys(details).length) {
    throw new ApiError(400, "Validation failed", { details });
  }
  await user.save();
  return user;
}

export async function changePassword(user, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new passwords are required");
  }
  const pwErr = validatePasswordStrength(newPassword);
  if (pwErr) {
    throw new ApiError(400, "Validation failed", {
      details: { newPassword: pwErr },
    });
  }

  const fresh = await User.findById(user._id).select("+passwordHash");
  const ok = await verifyPassword(currentPassword, fresh.passwordHash);
  if (!ok) {
    throw new ApiError(400, "Current password is incorrect", {
      details: { currentPassword: "Current password is incorrect" },
    });
  }

  fresh.passwordHash = await hashPassword(newPassword);
  fresh.passwordChangedAt = new Date();
  await fresh.save();
  await revokeAllSessions(fresh._id);
  return fresh;
}
