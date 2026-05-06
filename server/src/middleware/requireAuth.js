import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { User } from "../models/User.js";
import { COOKIE_NAMES } from "../utils/cookies.js";

// Reads the access token from an HttpOnly cookie. Falls back to the
// Authorization header for non-browser clients (curl, integration tests).
export async function requireAuth(req, _res, next) {
  try {
    const cookieToken = req.cookies?.[COOKIE_NAMES.access];
    const header = req.headers.authorization || "";
    const [scheme, headerToken] = header.split(" ");
    const token =
      cookieToken || (scheme === "Bearer" && headerToken) || null;

    if (!token) {
      throw new ApiError(401, "Authentication required", { code: "NO_AUTH" });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, "Session expired", { code: "ACCESS_EXPIRED" });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, "Account no longer exists", { code: "NO_USER" });
    }

    // Reject access tokens minted before the latest password change.
    if (
      user.passwordChangedAt &&
      payload.iat * 1000 < user.passwordChangedAt.getTime()
    ) {
      throw new ApiError(401, "Session is no longer valid", {
        code: "STALE_SESSION",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
