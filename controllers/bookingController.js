import Notification from "../models/Notification.js";
import Booking from "../models/Booking.js";
import Workspace from "../models/Workspace.js";
import { minutesToTime, timeToMinutes } from "../utils/time.js";
import { calculatePrice } from "../utils/calculatePrice.js";
import { findFlexibleBookingAdjustments } from "../utils/flexAdjust.js";

// Проверка пересечения по времени
const isTimeOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

export const createBooking = async (req, res) => {
  try {
    const {
      workspace,
      date,
      startTime,
      endTime,
      isFlexible,
      flexibilityRange,
      price,
    } = req.body;
    const userId = req.user._id;

    if (!price || price <= 0) {
      return res.status(400).json({ message: "Неверная стоимость бронирования" });
    }

    // Проверка: существует ли место
    const workspaceDoc = await Workspace.findById(workspace);
    if (!workspaceDoc || !workspaceDoc.isActive) {
      return res
        .status(404)
        .json({ message: "Рабочее место не найдено или отключено" });
    }

    // Получаем текущую дату и время
    const now = new Date();

    // Дата бронирования (без времени)
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Время начала и конца бронирования
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    // Текущая дата в формате без времени
    const nowDateOnly = new Date(now);
    nowDateOnly.setHours(0, 0, 0, 0);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Проверка: нельзя бронировать в прошлом
    const isSameDay = nowDateOnly.getTime() === bookingDate.getTime();
    const isBeforeToday = bookingDate < nowDateOnly;
    const isSameDayAndPastTime = isSameDay && newStart <= nowMinutes;

    if (isBeforeToday || isSameDayAndPastTime) {
      return res.status(400).json({ message: "Нельзя бронировать в прошлом" });
    }

    // Проверка: нельза бронировать во внерабочее время, время начала должно быть раньше времени окончания
    if (startTime < "08:00" || endTime > "22:00" || endTime <= startTime) {
      return res.status(400).json({
        message: "Бронирование возможно только в интервале с 08:00 до 22:00",
      });
    }

    // Проверка: длительность бронирования < 60 минут
    const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (durationMinutes < 60) {
      return res
        .status(400)
        .json({ message: "Минимальная длительность бронирования — 1 час" });
    }

    // Проверка: гибкость при длительности бронирования < 180 минут
    if (isFlexible && durationMinutes < 180) {
      return res.status(400).json({
        message:
          "Гибкое бронирование доступно только при длительности более 3 часов",
      });
    }

    // Проверка: нет повторяющихся бронирований у пользователя на этот день
    const existing = await Booking.findOne({
      user: req.user._id,
      date: new Date(date),
      status: "active",
    });

    const isAdmin = req.user.role === "admin";

    if (existing && !isAdmin) {
      return res.status(400).json({
        message: "У вас уже есть активное бронирование на этот день",
      });
    }

    // Поиск пересекающихся бронирований
    const existingBookings = await Booking.find({
      workspace,
      date: new Date(date),
      status: "active",
    });

    // Проверка: нет конфликтов по времени вообще
    const hasHardConflict = existingBookings.some(
      (b) =>
        isTimeOverlap(
          newStart,
          newEnd,
          timeToMinutes(b.startTime),
          timeToMinutes(b.endTime)
        ) && !b.isFlexible
    );

    if (hasHardConflict) {
      return res
        .status(409)
        .json({ message: "Время занято и разместить бронирование не удастся" });
    }

    // Отдельно ищем гибкие конфликты (если такие есть — пробуем решить)
    const flexibleConflicts = existingBookings.filter((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return b.isFlexible && isTimeOverlap(newStart, newEnd, bStart, bEnd);
    });

    if (flexibleConflicts.length > 0) {
      const adjustments = findFlexibleBookingAdjustments(existingBookings, {
        start: newStart,
        end: newEnd,
      });

      if (adjustments === null) {
        return res.status(409).json({
          message: "Невозможно разместить новое бронирование с учётом гибкости",
        });
      }

      for (const adj of adjustments) {
        const b = await Booking.findById(adj.id);

        const originalStart = timeToMinutes(b.startTime);
        const originalEnd = timeToMinutes(b.endTime);

        const newStartMin = timeToMinutes(adj.startTime);
        const newEndMin = timeToMinutes(adj.endTime);

        let totalReduction = 0;
        if (originalStart !== newStartMin) {
          totalReduction += Math.abs(originalStart - newStartMin);
        }
        if (originalEnd !== newEndMin) {
          totalReduction += Math.abs(originalEnd - newEndMin);
        }

        b.startTime = adj.startTime;
        b.endTime = adj.endTime;

        if (b.isFlexible) {
          b.remainingFlexibility = Math.max(
            0,
            b.remainingFlexibility - totalReduction
          );
          if (b.remainingFlexibility === 0) {
            b.isFlexible = false;
          }
        }

        await b.save();
      }
    }

    // Подсчет финальной стоимости
    const finalPrice = calculatePrice({
      startTime,
      endTime,
      pricePerHour: workspace.pricePerHour,
      isFlexible,
      flexibilityRange,
    });

    // Создание бронирования
    const booking = await Booking.create({
      user: userId,
      workspace,
      date,
      startTime,
      endTime,
      isFlexible,
      flexibilityRange,
      remainingFlexibility: isFlexible ? flexibilityRange : 0,
      price: finalPrice,
    });

    await Notification.create({
      user: req.user._id,
      message: `Бронирование рабочего места "${workspace.name}" успешно оформлено на ${date} с ${startTime} до ${endTime}.`,
      type: "booking",
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error("Ошибка при бронировании:", error);
    res.status(500).json({ message: "Ошибка сервера при создании бронирования" });
  }
};

// Получение собственных бронирований для пользователя
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("workspace", "name type pricePerHour")
      .sort({ date: 1, startTime: 1 });

    res.json(bookings);
  } catch (error) {
    console.error("Ошибка при получении бронирований:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Получение бронирований по ID рабочего места
export const getBookingsByWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { date } = req.query;

    const query = {
      workspace: workspaceId,
      status: "active",
    };

    if (date) {
      query.date = new Date(date);
    }

    const bookings = await Booking.find(query)
      .populate("workspace", "name type")
      .sort({ date: 1, startTime: 1 });

    const isAdmin = req.user?.role === "admin";
    const userId = req.user?._id?.toString();

    // Обрабатываем видимость
    const filtered = bookings.map((b) => {
      const bUserId = b.user?.toString?.() || b.user?._id?.toString?.();

      // Полный доступ — админ
      if (isAdmin) return b;

      // Полный доступ к своим броням
      const isOwner = userId && bUserId === userId;
      if (isOwner) return b;

      // Анонимный или чужой пользователь — обрезанный ответ
      return {
        _id: b._id,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        workspace: b.workspace,
        isFlexible: b.isFlexible,
        flexibilityRange: b.flexibilityRange,
      };
    });

    res.json(filtered);
  } catch (error) {
    console.error("Ошибка при получении бронирований по месту:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("workspace");

    if (!booking) {
      return res.status(404).json({ message: "Бронирование не найдено" });
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Нет доступа к отмене" });
    }

    booking.status = "cancelled";
    await booking.save();

    await Notification.create({
      user: booking.user,
      message: `Ваше бронирование рабочего места "${booking.workspace.name}" на ${
        new Date(booking.date).toISOString().split("T")[0]
      } с ${booking.startTime} - ${booking.endTime} было отменено.`,
      type: "booking",
    });

    res.json({ message: "Бронирование отменено" });
  } catch (error) {
    console.error("Ошибка при отмене бронирования:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("workspace", "name type")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Ошибка при получении всех бронирований:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Отметка бронирований как завершённых
export const markCompletedBookings = async (req, res) => {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Находим все активные брони, у которых дата меньше сегодня,
    // или сегодняшние — и они уже закончились
    const updated = await Booking.updateMany(
      {
        status: "active",
        $or: [
          { date: { $lt: now.setHours(0, 0, 0, 0) } },
          {
            date: new Date().setHours(0, 0, 0, 0),
            endTime: { $lte: minutesToTime(currentMinutes) },
          },
        ],
      },
      { $set: { status: "completed" } }
    );

    res.json({
      message: "Завершённые брони обновлены",
      count: updated.modifiedCount,
    });
  } catch (error) {
    console.error("Ошибка при обновлении завершённых броней:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Продление бронирования
export const extendBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    // Проверка формата
    if (!startTime || !endTime) {
      return res.status(400).json({ message: "Нужно указать новое время" });
    }

    // Проверка границ рабочего времени
    if (startTime < "08:00" || endTime > "22:00" || endTime <= startTime) {
      return res.status(400).json({
        message:
          "Продление возможно только в интервале с 08:00 до 22:00 и с корректным временем",
      });
    }

    const booking = await Booking.findById(id)
      .populate("user", "_id")
      .populate("workspace", "name");
    if (!booking) {
      return res.status(404).json({ message: "Бронирование не найдено" });
    }

    // Проверка на конфликты с другими бронированиями на том же месте
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: id },
      workspaceId: booking.workspaceId,
      date: booking.date,
      status: { $in: ["active", "flexible"] },
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (conflictingBooking) {
      return res.status(409).json({
        message: "В указанный интервал уже есть другое бронирование",
      });
    }

    booking.startTime = startTime;
    booking.endTime = endTime;
    await booking.save();

    console.log(booking.user.id, booking.workspace.name, booking.date);

    await Notification.create({
      user: booking.user.id,
      message: `Время бронирования рабочего места "${
        booking.workspace.name
      }" было изменено на ${
        booking.date.toISOString().split("T")[0]
      } с ${startTime} до ${endTime}.`,
      type: "booking",
    });

    res.json({ message: "Бронирование обновлено", booking });
  } catch (error) {
    console.error("Ошибка при продлении бронирования:", error);
    res.status(500).json({ message: "Не удалось продлить бронирование" });
  }
};
