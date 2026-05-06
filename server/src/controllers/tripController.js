import mongoose from "mongoose";
import {
  createTrip as createTripSvc,
  listTrips as listTripsSvc,
  getTripById as getTripByIdSvc,
  getTripByShareId as getTripByShareIdSvc,
  deleteTrip as deleteTripSvc,
} from "../services/tripService.js";
import { ApiError } from "../utils/ApiError.js";

function assertObjectId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid trip id");
  }
}

export async function createTrip(req, res, next) {
  try {
    const trip = await createTripSvc(req.user, req.body);
    res.status(201).json({ trip: trip.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function listTrips(req, res, next) {
  try {
    const trips = await listTripsSvc(req.user);
    res.json({
      trips: trips.map((t) => ({
        id: t._id.toString(),
        destination: t.destination,
        region: t.region,
        tripType: t.tripType,
        duration: t.duration,
        summary: t.summary,
        prompt: t.prompt,
        payload: t.payload,
        shareId: t.shareId,
        savedAt: t.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrip(req, res, next) {
  try {
    assertObjectId(req.params.id);
    const trip = await getTripByIdSvc(req.user, req.params.id);
    res.json({ trip: trip.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function deleteTrip(req, res, next) {
  try {
    assertObjectId(req.params.id);
    await deleteTripSvc(req.user, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// Public — no auth. Recipients of a share link land here.
export async function getSharedTrip(req, res, next) {
  try {
    const trip = await getTripByShareIdSvc(req.params.shareId);
    res.json({ trip: trip.toSharedJSON() });
  } catch (err) {
    next(err);
  }
}
