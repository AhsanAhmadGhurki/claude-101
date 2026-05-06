import "dotenv/config";

const required = ["MONGODB_URI", "JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(
    `Missing required env vars: ${missing.join(", ")}. ` +
      `Copy server/.env.example to server/.env and fill them in.`
  );
}

const truthy = (v, def = false) =>
  v == null ? def : ["1", "true", "yes", "on"].includes(String(v).toLowerCase());

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  jwtSecret: process.env.JWT_SECRET,
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7,

  cookieSecure: truthy(process.env.COOKIE_SECURE, false),
  cookieSameSite: process.env.COOKIE_SAMESITE || "lax",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  requireEmailVerification: truthy(process.env.REQUIRE_EMAIL_VERIFICATION, true),

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || "Adventure AI <noreply@adventure.local>",
  },
};

export const isProd = env.nodeEnv === "production";
