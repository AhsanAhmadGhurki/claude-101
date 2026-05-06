import { ApiError } from "../utils/ApiError.js";

// Stops write operations (save trip, future edit endpoints) from succeeding
// while the user's email is still unverified. Must run after requireAuth so
// req.user is populated. The stable code lets the SPA route the user to the
// "check your inbox" flow rather than rendering a generic permission error.
export function requireVerified(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required", { code: "NO_AUTH" }));
  }
  if (!req.user.isVerified) {
    return next(
      new ApiError(403, "Verify your email before saving trips.", {
        code: "EMAIL_NOT_VERIFIED",
      })
    );
  }
  next();
}
