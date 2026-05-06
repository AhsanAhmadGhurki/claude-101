import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name is too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: "Email is invalid",
      },
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Email verification — boolean flag flipped when an email_verification
    // OTP is consumed. The OTP itself lives in the Otp collection (with TTL),
    // not on the User document.
    isVerified: { type: Boolean, default: false },

    // Bumped on password changes — used to invalidate old access tokens
    // server-side without a per-token blocklist.
    passwordChangedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
