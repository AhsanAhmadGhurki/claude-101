import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireVerified } from "../middleware/requireVerified.js";
import {
  createTrip,
  listTrips,
  getTrip,
  deleteTrip,
  getSharedTrip,
} from "../controllers/tripController.js";

const router = Router();

// Public read-by-share-token. Must be registered BEFORE the auth gate
// below so anonymous recipients of a share URL don't get a 401.
router.get("/share/:shareId", getSharedTrip);

router.use(requireAuth);
router.post("/", requireVerified, createTrip);
router.get("/", listTrips);
router.get("/:id", getTrip);
router.delete("/:id", deleteTrip);

export default router;
