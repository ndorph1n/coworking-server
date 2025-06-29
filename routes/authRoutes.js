import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";

const router = express.Router();

// Регистрация нового пользователя
router.post("/register", validate(registerSchema), registerUser);

// Логин пользователя
router.post("/login", validate(loginSchema), loginUser);

export default router;
