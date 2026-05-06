import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { csrfProtection } from "./middleware/csrf.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  // Behind a reverse proxy (Heroku, nginx, etc.) — needed for correct req.ip.
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.clientOrigin,
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

  // Backwards-compat with the original protected demo endpoint.
  app.get("/api/dashboard", requireAuth, (req, res) => {
    res.json({
      message: `Welcome back, ${req.user.name}.`,
      user: req.user.toPublicJSON(),
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
