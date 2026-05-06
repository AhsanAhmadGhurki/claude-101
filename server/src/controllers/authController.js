import {
  createUser,
  authenticate,
  verifyEmailToken,
  resendVerification,
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

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const { user, emailResult } = await createUser({ name, email, password });
    await issueSession(res, user, { req });

    res.status(201).json({
      user: user.toPublicJSON(),
      // In dev only, surface the verify link so the user can click through
      // without configuring SMTP.
      ...(emailResult?.link && !isProd ? { verifyLink: emailResult.link } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const user = await authenticate({ email, password });
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

export async function verifyEmail(req, res, next) {
  try {
    const token = req.body?.token || req.query?.token;
    const user = await verifyEmailToken(token);
    res.json({ ok: true, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function requestVerifyEmail(req, res, next) {
  try {
    const { email } = req.body || {};
    const result = await resendVerification(email);
    res.json({
      ok: true,
      ...(result?.link && !isProd ? { verifyLink: result.link } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    const result = await startPasswordReset(email);
    // Always 200 — never leak whether the email exists.
    res.json({
      ok: true,
      ...(result?.link && !isProd ? { resetLink: result.link } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {};
    await completePasswordReset({ token, password });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
