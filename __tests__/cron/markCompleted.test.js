import Booking from "../../models/Booking.js";
import { completeBookingJob } from "../../cron/completeBookingJob.js";
import { timeToMinutes } from "../../utils/time.js";

jest.mock("../../models/Booking.js");
jest.mock("../../utils/time.js");

describe("completeBookingJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("должен пометить бронирования как завершённые", async () => {
    // Подготавливаем фейковые бронирования
    const now = new Date("2025-06-21T15:00:00Z");
    const fakeBookings = [
      {
        _id: "1",
        endTime: "12:00",
        date: new Date("2025-06-21"),
        status: "active",
      },
      {
        _id: "2",
        endTime: "16:00",
        date: new Date("2025-06-21"),
        status: "active",
      },
    ];

    global.Date = class extends Date {
      constructor(...args) {
        if (args.length) return super(...args);
        return new Date(now);
      }
    };

    Booking.find.mockResolvedValue(fakeBookings);
    Booking.updateMany.mockResolvedValue({ modifiedCount: 1 });
    timeToMinutes.mockImplementation((time) => {
      if (time === "12:00") return 720;
      if (time === "16:00") return 960;
    });

    await completeBookingJob();

    expect(Booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        $or: expect.any(Array),
      }),
      { $set: { status: "completed" } }
    );
  });

  it("не должен обновлять ничего, если нет завершившихся бронирований", async () => {
    const now = new Date("2025-06-21T15:00:00Z");
    const fakeBookings = [
      {
        _id: "2",
        endTime: "16:00",
        date: new Date("2025-06-21"),
        status: "active",
      },
    ];

    global.Date = class extends Date {
      constructor(...args) {
        if (args.length) return super(...args);
        return new Date(now);
      }
    };

    Booking.find.mockResolvedValue(fakeBookings);
    timeToMinutes.mockReturnValue(960); // 16:00
    Booking.updateMany.mockResolvedValue({ modifiedCount: 0 });

    await completeBookingJob();

    expect(Booking.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ _id: "2" }),
      expect.anything()
    );
  });

  it("должен обрабатывать ошибки", async () => {
    Booking.find.mockRejectedValue(new Error("DB error"));
    await expect(completeBookingJob()).resolves.toBeUndefined();
  });
});
