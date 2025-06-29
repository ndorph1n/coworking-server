import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  updateUserById,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.patch("/profile", protect, updateUserProfile);
router.patch("/:id", protect, isAdmin, updateUserById);

router.get("/", protect, isAdmin, getAllUsers);
router.delete("/:id", protect, isAdmin, deleteUser);

export default router;
