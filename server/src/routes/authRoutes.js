import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  signin,
  refresh,
  signout,
  verifyEmail,
  requestVerifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = Router();

// Per-IP throttle on credential endpoints — brute force, account
// enumeration, generic abuse.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter per-IP throttle for signin specifically — 5 attempts per
// 15 minutes per IP. Matches typical password-brute-force thresholds and
// gives us a backstop even if the client-side lockout warning is bypassed.
// Surfaces a stable `code` so the SPA can render a "too many attempts" UI
// rather than a generic 429.
const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many sign-in attempts. Try again in a few minutes.",
      code: "RATE_LIMITED",
    });
  },
});

// Per-IP throttle on email-sending endpoints. Looser bucket; tightens the
// budget for using us as a spam relay.
const ipEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-EMAIL throttle on email-sending endpoints. Bound to the recipient,
// not the requester — even if a flood of attackers hits us from many IPs,
// a single victim's mailbox stays calm. Layered with ipEmailLimiter and the
// per-(user, purpose) cooldown enforced inside otpService.
//
// keyGenerator runs after express.json so req.body is populated. Falls back
// to req.ip when no email is present so we never fail open.
const perEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    return email ? `email:${email}` : `ip:${req.ip}`;
  },
});

router.post("/signup", credentialLimiter, perEmailLimiter, signup);
router.post("/signin", signinLimiter, credentialLimiter, signin);
router.post("/refresh", credentialLimiter, refresh);
router.post("/signout", signout);

router.post("/verify-email", credentialLimiter, verifyEmail);
router.post("/request-verify-email", ipEmailLimiter, perEmailLimiter, requestVerifyEmail);

router.post("/forgot-password", ipEmailLimiter, perEmailLimiter, forgotPassword);
router.post("/reset-password", credentialLimiter, resetPassword);

export default router;
