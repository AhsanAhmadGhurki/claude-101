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

// Throttle credential endpoints — brute force, account enumeration, abuse.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit on email-sending endpoints (forgot, resend verify) so we
// don't get used as a spam relay.
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", credentialLimiter, signup);
router.post("/signin", credentialLimiter, signin);
router.post("/refresh", credentialLimiter, refresh);
router.post("/signout", signout);

router.post("/verify-email", verifyEmail);
router.post("/request-verify-email", emailLimiter, requestVerifyEmail);

router.post("/forgot-password", emailLimiter, forgotPassword);
router.post("/reset-password", credentialLimiter, resetPassword);

export default router;
