import validator from "validator";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../utils/password.js";
import { randomToken, sha256 } from "../utils/cryptoTokens.js";
import { revokeAllSessions } from "./authService.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./emailService.js";
import { env } from "../config/env.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 15 * 60 * 1000; // 15m

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

export async function createUser({ name, email, password }) {
  const details = validateSignupInput({ name, email, password });
  if (Object.keys(details).length) {
    throw new ApiError(400, "Validation failed", { details });
  }

  const normalizedEmail = email.toLowerCase().trim();
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

  // Generate a verification token and email it. The link contains the raw
  // token; we only persist its hash.
  const rawToken = randomToken(32);
  user.verificationTokenHash = sha256(rawToken);
  user.verificationExpiresAt = new Date(Date.now() + VERIFY_TTL_MS);
  await user.save();

  const emailResult = await sendVerificationEmail(user, rawToken);

  return { user, emailResult };
}

export async function authenticate({ email, password }) {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
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

export async function verifyEmailToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    throw new ApiError(400, "Invalid verification link");
  }
  const tokenHash = sha256(rawToken);
  const user = await User.findOne({ verificationTokenHash: tokenHash }).select(
    "+verificationTokenHash +verificationExpiresAt"
  );
  if (!user || !user.verificationExpiresAt || user.verificationExpiresAt < new Date()) {
    throw new ApiError(400, "Verification link is invalid or expired");
  }

  user.isVerified = true;
  user.verificationTokenHash = undefined;
  user.verificationExpiresAt = undefined;
  await user.save();
  return user;
}

export async function resendVerification(email) {
  // Always 200 from the controller — never reveal whether email exists.
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || user.isVerified) return { sent: false };

  const rawToken = randomToken(32);
  user.verificationTokenHash = sha256(rawToken);
  user.verificationExpiresAt = new Date(Date.now() + VERIFY_TTL_MS);
  await user.save();
  return sendVerificationEmail(user, rawToken);
}

export async function startPasswordReset(email) {
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  // Don't tell the caller — silent no-op if user doesn't exist.
  if (!user) return { sent: false };

  const rawToken = randomToken(32);
  user.resetTokenHash = sha256(rawToken);
  user.resetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  await user.save();
  return sendPasswordResetEmail(user, rawToken);
}

export async function completePasswordReset({ token, password }) {
  const pwErr = validatePasswordStrength(password);
  if (pwErr) throw new ApiError(400, "Validation failed", { details: { password: pwErr } });

  if (!token) throw new ApiError(400, "Reset link is invalid");
  const user = await User.findOne({ resetTokenHash: sha256(token) }).select(
    "+resetTokenHash +resetExpiresAt"
  );
  if (!user || !user.resetExpiresAt || user.resetExpiresAt < new Date()) {
    throw new ApiError(400, "Reset link is invalid or expired");
  }

  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = undefined;
  user.resetExpiresAt = undefined;
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
    const normalized = String(email).toLowerCase().trim();
    if (!validator.isEmail(normalized)) {
      details.email = "Enter a valid email address";
    } else if (normalized !== user.email) {
      const taken = await User.findOne({ email: normalized });
      if (taken) details.email = "Email already in use";
      else {
        user.email = normalized;
        // Email changed → re-verify, send a fresh link.
        user.isVerified = false;
        const rawToken = randomToken(32);
        user.verificationTokenHash = sha256(rawToken);
        user.verificationExpiresAt = new Date(Date.now() + VERIFY_TTL_MS);
        await sendVerificationEmail(user, rawToken);
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
