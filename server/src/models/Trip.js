import mongoose from "mongoose";

// Embedded sub-docs are kept loose (Schema.Types.Mixed for the day/timeline
// structure) so we can persist whatever the AI generator produced without
// migrating the schema every time the trip shape evolves. The "shape" we
// commit to is the small set of indexed top-level fields below — everything
// else lives in `payload`.
const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Top-level fields used for dedupe, list rendering, and stats. These
    // mirror what the cards render so we don't need to deserialise `payload`
    // for the listing API.
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: [200, "Destination is too long"],
    },
    region: { type: String, trim: true, maxlength: 200 },
    tripType: { type: String, trim: true, maxlength: 60 },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    summary: { type: String, trim: true, maxlength: 2000 },
    prompt: { type: String, trim: true, maxlength: 1000 },

    // Full generated trip — kept opaque to avoid coupling the schema to the
    // generator's shape.
    payload: { type: mongoose.Schema.Types.Mixed, required: true },

    // Random unguessable token used to expose this trip on the public
    // share endpoint (GET /api/trips/share/:shareId). Knowing the token is
    // sufficient to read the trip, so it must be generated server-side and
    // long enough to resist brute force — `crypto.randomUUID()` (122 bits
    // of entropy) is well above the bar for share-link defaults.
    shareId: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Dedupe key — same destination + duration + tripType for the same user is
// considered "the same trip". Re-saves bump `updatedAt` instead of inserting
// a duplicate row.
tripSchema.index(
  { user: 1, destination: 1, duration: 1, tripType: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

tripSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    destination: this.destination,
    region: this.region,
    tripType: this.tripType,
    duration: this.duration,
    summary: this.summary,
    prompt: this.prompt,
    payload: this.payload,
    shareId: this.shareId,
    savedAt: this.updatedAt,
    createdAt: this.createdAt,
  };
};

// Returned from the public share endpoint — strips the prompt (often
// contains personal phrasing like "for me and my partner") and never
// reveals the owning user. Recipients only need the rendered itinerary.
tripSchema.methods.toSharedJSON = function toSharedJSON() {
  return {
    id: this._id.toString(),
    destination: this.destination,
    region: this.region,
    tripType: this.tripType,
    duration: this.duration,
    summary: this.summary,
    payload: this.payload,
    shareId: this.shareId,
    savedAt: this.updatedAt,
  };
};

export const Trip = mongoose.model("Trip", tripSchema);
