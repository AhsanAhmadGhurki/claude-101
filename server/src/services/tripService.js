import crypto from "node:crypto";
import { Trip } from "../models/Trip.js";
import { ApiError } from "../utils/ApiError.js";

function pickString(v, max) {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  return max ? trimmed.slice(0, max) : trimmed;
}

// Validates the inbound payload at the service boundary. Routes/controllers
// stay thin (per project rules) — bad input from the client ends up here.
function normalize(input) {
  if (!input || typeof input !== "object") {
    throw new ApiError(400, "Trip payload is required");
  }
  const destination = pickString(input.destination, 200);
  if (!destination) {
    throw new ApiError(400, "Destination is required", {
      details: { destination: "Destination is required" },
    });
  }
  const days = Array.isArray(input.days) ? input.days : null;
  const duration = Number.isFinite(input.duration)
    ? Math.trunc(input.duration)
    : days
    ? days.length
    : null;
  if (!duration || duration < 1 || duration > 30) {
    throw new ApiError(400, "Trip duration must be between 1 and 30 days", {
      details: { duration: "Duration must be 1–30 days" },
    });
  }
  return {
    destination,
    region: pickString(input.region, 200),
    tripType: pickString(input.tripType, 60),
    duration,
    summary: pickString(input.summary, 2000),
    prompt: pickString(input.prompt, 1000),
    payload: input,
  };
}

export async function createTrip(user, input) {
  const data = normalize(input);
  // Upsert on the (user, destination, duration, tripType) unique index so a
  // re-save refreshes timestamps + payload instead of failing with a 409.
  const filter = {
    user: user._id,
    destination: data.destination,
    duration: data.duration,
    tripType: data.tripType ?? "",
  };
  // $set covers the editable fields on every save; $setOnInsert seeds the
  // shareId exactly once on insert so re-saves never rotate (and break)
  // existing share URLs.
  const update = {
    $set: { ...data, tripType: data.tripType ?? "" },
    $setOnInsert: { shareId: crypto.randomUUID() },
  };
  const trip = await Trip.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  });
  return trip;
}

export async function getTripByShareId(shareId) {
  if (!shareId || typeof shareId !== "string") {
    throw new ApiError(400, "Invalid share link");
  }
  const trip = await Trip.findOne({ shareId });
  if (!trip) throw new ApiError(404, "Shared trip not found or expired");
  return trip;
}

export async function listTrips(user) {
  return Trip.find({ user: user._id }).sort({ updatedAt: -1 }).lean();
}

export async function getTripById(user, id) {
  const trip = await Trip.findOne({ _id: id, user: user._id });
  if (!trip) throw new ApiError(404, "Trip not found");
  return trip;
}

export async function deleteTrip(user, id) {
  const result = await Trip.findOneAndDelete({ _id: id, user: user._id });
  if (!result) throw new ApiError(404, "Trip not found");
}

export async function tripStats(user) {
  const [count, latest] = await Promise.all([
    Trip.countDocuments({ user: user._id }),
    Trip.findOne({ user: user._id })
      .sort({ updatedAt: -1 })
      .select("updatedAt destination")
      .lean(),
  ]);
  return {
    count,
    lastSavedAt: latest?.updatedAt ?? null,
    lastDestination: latest?.destination ?? null,
  };
}
