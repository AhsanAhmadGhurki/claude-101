import { RefreshToken } from "../models/RefreshToken.js";
import { ApiError } from "../utils/ApiError.js";
import {
  generateRefreshToken,
  refreshExpiryFromNow,
  signAccessToken,
} from "../utils/token.js";
import { sha256, randomToken } from "../utils/cryptoTokens.js";
import {
  COOKIE_NAMES,
  accessCookieOptions,
  refreshCookieOptions,
  csrfCookieOptions,
  clearAuthCookies,
} from "../utils/cookies.js";
import { env } from "../config/env.js";

// Approximate access TTL in ms for cookie maxAge. The JWT itself is the
// authoritative expiry; this just lets the browser drop the cookie around
// the same time so we don't keep a useless one around.
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = () => env.refreshTtlDays * 24 * 60 * 60 * 1000;

// Issue access + refresh + csrf cookies and persist a hashed refresh record.
export async function issueSession(res, user, { req } = {}) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const csrfToken = randomToken(24);

  await RefreshToken.create({
    user: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt: refreshExpiryFromNow(),
    userAgent: req?.get?.("user-agent")?.slice(0, 256),
    ip: req?.ip,
  });

  res.cookie(COOKIE_NAMES.access, accessToken, accessCookieOptions(ACCESS_TTL_MS));
  res.cookie(
    COOKIE_NAMES.refresh,
    refreshToken,
    refreshCookieOptions(REFRESH_TTL_MS())
  );
  res.cookie(COOKIE_NAMES.csrf, csrfToken, csrfCookieOptions(REFRESH_TTL_MS()));
}

// Rotate: validate the presented refresh token, revoke it, and issue a fresh
// pair. If we ever see a *revoked* refresh used again, we treat it as theft
// and revoke the entire user's refresh tokens.
export async function rotateSession(res, presentedRefresh, { req } = {}) {
  if (!presentedRefresh) {
    throw new ApiError(401, "Missing refresh token", { code: "NO_REFRESH" });
  }
  const tokenHash = sha256(presentedRefresh);
  const record = await RefreshToken.findOne({ tokenHash }).populate("user");

  if (!record) {
    throw new ApiError(401, "Invalid refresh token", { code: "BAD_REFRESH" });
  }

  // Reuse of a revoked token => assume compromise, nuke the family.
  if (record.revokedAt) {
    await RefreshToken.updateMany(
      { user: record.user, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    throw new ApiError(401, "Refresh token reuse detected", {
      code: "REFRESH_REUSE",
    });
  }

  if (record.expiresAt <= new Date()) {
    throw new ApiError(401, "Refresh token expired", { code: "REFRESH_EXPIRED" });
  }

  if (!record.user) {
    throw new ApiError(401, "Account no longer exists", { code: "NO_USER" });
  }

  // Issue successor first so we can store its hash on the old record.
  const newRefresh = generateRefreshToken();
  const newRefreshHash = sha256(newRefresh);
  const accessToken = signAccessToken(record.user);
  const csrfToken = randomToken(24);

  await RefreshToken.create({
    user: record.user._id,
    tokenHash: newRefreshHash,
    expiresAt: refreshExpiryFromNow(),
    userAgent: req?.get?.("user-agent")?.slice(0, 256),
    ip: req?.ip,
  });

  record.revokedAt = new Date();
  record.replacedBy = newRefreshHash;
  await record.save();

  res.cookie(COOKIE_NAMES.access, accessToken, accessCookieOptions(ACCESS_TTL_MS));
  res.cookie(
    COOKIE_NAMES.refresh,
    newRefresh,
    refreshCookieOptions(REFRESH_TTL_MS())
  );
  res.cookie(COOKIE_NAMES.csrf, csrfToken, csrfCookieOptions(REFRESH_TTL_MS()));

  return record.user;
}

// Sign-out a single session.
export async function revokeSession(res, presentedRefresh) {
  if (presentedRefresh) {
    await RefreshToken.updateOne(
      { tokenHash: sha256(presentedRefresh), revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
  clearAuthCookies(res);
}

// Used after sensitive changes (password reset / change) — kill all sessions.
export async function revokeAllSessions(userId) {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}
