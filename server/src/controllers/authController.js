import {
  createUser,
  authenticate,
  startLoginOtp,
  verifyLoginOtp,
  verifyEmailOtp,
  requestVerificationOtp,
  startPasswordReset,
  completePasswordReset,
} from "../services/userService.js";
import {
  issueSession,
  rotateSession,
  revokeSession,
} from "../services/authService.js";
import { COOKIE_NAMES } from "../utils/cookies.js";
import { isProd } from "../config/env.js";

// Surface the OTP code in dev-mode responses so a developer can complete the
// flow without configuring SMTP. Stripped from prod responses entirely.
function devOtp(emailResult) {
  if (isProd || !emailResult?.code) return {};
  return { devOtp: emailResult.code };
}

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const { user, emailResult } = await createUser({ name, email, password });
    await issueSession(res, user, { req });

    res.status(201).json({
      user: user.toPublicJSON(),
      ...devOtp(emailResult),
    });
  } catch (err) {
    next(err);
  }
}

// signin is now a two-step flow:
//   step 1: POST /auth/signin    → verify creds, issue login OTP
//   step 2: POST /auth/verify-login-otp → consume OTP, issue session
//
// Step 1 returns { pendingOtp: true, email } and DOES NOT set auth cookies.
// Frontend then collects the OTP and posts to /verify-login-otp.
export async function signin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const user = await authenticate({ email, password });
    const otpResult = await startLoginOtp(user);
    res.json({
      pendingOtp: true,
      email: user.email,
      ...devOtp(otpResult),
    });
  } catch (err) {
    next(err);
  }
}

// Step 2 of signin: validate the OTP and issue session cookies.
export async function verifyLogin(req, res, next) {
  try {
    const { email, code } = req.body || {};
    const user = await verifyLoginOtp({ email, code });
    await issueSession(res, user, { req });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const presented = req.cookies?.[COOKIE_NAMES.refresh];
    const user = await rotateSession(res, presented, { req });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function signout(req, res, next) {
  try {
    const presented = req.cookies?.[COOKIE_NAMES.refresh];
    await revokeSession(res, presented);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// Verify a 6-digit email-verification OTP. Body: { email, code }.
export async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body || {};
    const user = await verifyEmailOtp({ email, code });
    res.json({ ok: true, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// Request (or re-issue) a verification OTP for the given email. Always 200 —
// never reveal whether the email exists or is already verified.
export async function requestVerifyEmail(req, res, next) {
  try {
    const { email } = req.body || {};
    const result = await requestVerificationOtp(email);
    res.json({ ok: true, ...devOtp(result) });
  } catch (err) {
    next(err);
  }
}

// Issue a password-reset OTP. Always 200 — same enumeration-prevention
// posture as verify-email.
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    const result = await startPasswordReset(email);
    res.json({ ok: true, ...devOtp(result) });
  } catch (err) {
    next(err);
  }
}

// Consume a password-reset OTP and apply the new password.
// Body: { email, code, password }.
export async function resetPassword(req, res, next) {
  try {
    const { email, code, password } = req.body || {};
    await completePasswordReset({ email, code, password });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
