import { timeToMinutes, minutesToTime } from "./time.js";

const isOverlap = (aStart, aEnd, bStart, bEnd) => {
  return aStart < bEnd && bStart < aEnd;
};

export const findFlexibleBookingAdjustments = (existingBookings, newBooking) => {
  const { start: newStart, end: newEnd } = newBooking;
  const adjustments = [];

  for (const booking of existingBookings) {
    const bStart = timeToMinutes(booking.startTime);
    const bEnd = timeToMinutes(booking.endTime);
    const flex = booking.remainingFlexibility ?? booking.flexibilityRange;

    if (!booking.isFlexible || !isOverlap(newStart, newEnd, bStart, bEnd)) continue;

    const duration = bEnd - bStart;

    // 1. Сжатие с конца
    if (newStart >= bStart && newStart < bEnd) {
      const newEndTime = newStart;
      const reduced = bEnd - newEndTime;
      if (reduced <= flex && newEndTime - bStart >= 60) {
        adjustments.push({
          id: booking._id,
          startTime: booking.startTime,
          endTime: minutesToTime(newEndTime),
          makeInflexible: reduced === flex,
        });
        continue;
      }
    }

    // 2. Сжатие с начала
    if (newEnd > bStart && newEnd <= bEnd) {
      const newStartTime = newEnd;
      const reduced = newStartTime - bStart;
      if (reduced <= flex && bEnd - newStartTime >= 60) {
        adjustments.push({
          id: booking._id,
          startTime: minutesToTime(newStartTime),
          endTime: booking.endTime,
          makeInflexible: reduced === flex,
        });
        continue;
      }
    }

    // 3. Сжатие с двух сторон
    if (newStart > bStart && newEnd < bEnd) {
      const shrinkLeft = newStart - bStart;
      const shrinkRight = bEnd - newEnd;
      const totalShrink = shrinkLeft + shrinkRight;

      if (totalShrink <= flex && newEnd - newStart >= 60) {
        adjustments.push({
          id: booking._id,
          startTime: minutesToTime(newStart),
          endTime: minutesToTime(newEnd),
          makeInflexible: totalShrink === flex,
        });
        continue;
      }
    }

    return null; // если ни один вариант не подошёл
  }

  return adjustments.length > 0 ? adjustments : null;
};
