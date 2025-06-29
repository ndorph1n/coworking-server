import express from "express";
import {
  getAllWorkspaces,
  getAllWorkspacesForAdmin,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  handleActivationWorkpsace,
  deleteWorkspace,
  uploadWorkspacePhotos,
} from "../controllers/workspaceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { uploadWorkspaceImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// GET /api/workspaces — все рабочие места
router.get("/", getAllWorkspaces);
router.get("/admin", protect, isAdmin, getAllWorkspacesForAdmin);

// POST /api/workspaces — создать новое рабочее место (только админ)
router.post("/", protect, isAdmin, createWorkspace);

// PUT /api/workspaces/:id — редактировать (только админ)
router.put("/:id", protect, isAdmin, updateWorkspace);

// PATCH /api/workspaces/:id — активация/деактивация (только админ)
router.patch("/:id/activation", protect, isAdmin, handleActivationWorkpsace);

// DELETE /api/workspaces/:id — полное удаление (только админ)
router.delete("/:id", protect, isAdmin, deleteWorkspace);

// GET /api/workspaces/:id — получить рабочее место по ID
router.get("/:id", getWorkspaceById);

// POST /api/workspaces/:id/images — загрука фотографий рабочего места
router.post(
  "/:id/images",
  protect,
  isAdmin,
  uploadWorkspaceImages.array("images", 5),
  uploadWorkspacePhotos
);

export default router;
