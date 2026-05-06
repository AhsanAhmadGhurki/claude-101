import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

export function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found"));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([k, e]) => [k, e.message])
    );
    return res.status(400).json({ error: "Validation failed", details });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: "Email already in use",
      details: { email: "Email already in use" },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
      ...(err.details ? { details: err.details } : {}),
    });
  }

  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
}
