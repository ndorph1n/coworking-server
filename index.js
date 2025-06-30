import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import path from "path";

// Роуты
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import worspaceRoutes from "./routes/workspaceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import layoutRoutes from "./routes/layoutRoutes.js";

import { startBookingCompletionJob } from "./cron/completeBookingJob.js";

dotenv.config();

const allowedOrigin = process.env.ALLOWED_ORIGIN;

const app = express();
connectDB();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === allowedOrigin) {
        return callback(null, true);
      }
      console.error("CORS blocked origin:", origin); // для отладки
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

// Тестовый маршрут
app.get("/api/ping", (req, res) => {
  res.send("pong");
});

app.use("/uploads", express.static(path.resolve("uploads")));

// Маршруты аутентификации/регистрации
app.use("/api/auth", authRoutes);
// Маршруты пользователей
app.use("/api/users", userRoutes);
// Маршруты рабочих мест
app.use("/api/workspaces", worspaceRoutes);
// Маршруты бронирования
app.use("/api/bookings", bookingRoutes);
// Маршруты уведомлений
app.use("/api/notifications", notificationRoutes);
// Маршруты загрузки плана помещения
app.use("/api/layout", layoutRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  startBookingCompletionJob(); // Запуск задачи по отметке завершению бронирований
});
