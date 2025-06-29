import cron from "node-cron";
import Booking from "../models/Booking.js";
import { minutesToTime } from "../utils/time.js";

export const completeBookingJob = async () => {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Booking.updateMany(
      {
        status: "active",
        $or: [
          { date: { $lt: today } },
          {
            date: today,
            endTime: { $lte: minutesToTime(currentMinutes) },
          },
        ],
      },
      { $set: { status: "completed" } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[CRON] Обновлено завершённых бронирований: ${result.modifiedCount}`
      );
    }
  } catch (error) {
    console.error("[CRON] Ошибка при завершении бронирований:", error);
  }
};

// Основной запуск задачи по расписанию
export const startBookingCompletionJob = () => {
  console.log("[CRON] Запуск задачи завершения бронирований...");
  cron.schedule("*/1 * * * *", completeBookingJob);
};
