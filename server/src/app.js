import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { csrfProtection } from "./middleware/csrf.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { tripStats } from "./services/tripService.js";

export function createApp() {
  const app = express();

  // Behind a reverse proxy (Heroku, nginx, etc.) — needed for correct req.ip.
  app.set("trust proxy", 1);

  // CLIENT_ORIGIN may be a single origin or a comma-separated list — typical
  // production setup needs the local dev origin, the Vercel preview origin,
  // and the production domain all permitted.
  const allowedOrigins = String(env.clientOrigin)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        // Server-to-server / curl / same-origin (no Origin header) — allow.
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS: origin "${origin}" not allowed`));
      },
      credentials: true, // required for cookie auth
    })
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  // CSRF runs before any state-changing handler. Safe methods and a small
  // allowlist (signin/signup/refresh) are exempt — see middleware/csrf.js.
  app.use(csrfProtection);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/trips", tripRoutes);

  // Returns real account data — trip count, last-saved timestamp/destination
  // — so the dashboard UI doesn't need a second round-trip after mount.
  app.get("/api/dashboard", requireAuth, async (req, res, next) => {
    try {
      const stats = await tripStats(req.user);
      res.json({
        user: req.user.toPublicJSON(),
        stats,
      });
    } catch (err) {
      next(err);
    }
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
