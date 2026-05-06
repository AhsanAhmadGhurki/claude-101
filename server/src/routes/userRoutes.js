import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  me,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";

const router = Router();

router.use(requireAuth);
router.get("/me", me);
router.patch("/me", updateProfile);
router.post("/change-password", changePassword);

export default router;
