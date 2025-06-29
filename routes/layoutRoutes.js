import express from "express";
import {
  uploadLayoutImage,
  getLayoutImage,
} from "../controllers/layoutController.js";
import { uploadLayout } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, isAdmin, uploadLayout.single("layout"), uploadLayoutImage);
router.get("/", getLayoutImage);

export default router;
