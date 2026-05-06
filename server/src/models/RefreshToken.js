import mongoose from "mongoose";

// We store SHA-256 of the refresh token, never the token itself. Rotation:
// when a refresh is consumed we mark `revokedAt` and chain to the replacement
// via `replacedBy`. If a revoked token is presented again, every token in
// that chain is force-revoked (likely token theft).
const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    // No `index: true` here — the TTL index below covers both purposes.
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null }, // tokenHash of the successor
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

// MongoDB TTL: documents auto-delete shortly after expiresAt.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.virtual("isActive").get(function () {
  return !this.revokedAt && this.expiresAt > new Date();
});

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
