import { findFlexibleBookingAdjustments } from "../../utils/flexAdjust.js";

describe("findFlexibleBookingAdjustments", () => {
  it("возвращает корректный сдвиг при сжатии с конца", () => {
    const existingBookings = [
      {
        _id: "1",
        isFlexible: true,
        startTime: "09:00",
        endTime: "13:00",
        flexibilityRange: 60,
      },
    ];

    const newBooking = { start: 12 * 60, end: 16 * 60 }; // 10:00 - 12:00

    const result = findFlexibleBookingAdjustments(existingBookings, newBooking);
    expect(result).not.toBeNull();
    expect(result[0].startTime).toBe("09:00");
    expect(result[0].endTime).toBe("12:00");
  });

  it("возвращает null, если невозможно сжать", () => {
    const existingBookings = [
      {
        _id: "1",
        isFlexible: true,
        startTime: "09:00",
        endTime: "11:00",
        flexibilityRange: 15,
      },
    ];

    const newBooking = { start: 10 * 60, end: 12 * 60 }; // требует сжать на 60 минут

    const result = findFlexibleBookingAdjustments(existingBookings, newBooking);
    expect(result).toBeNull();
  });
});
