import { createBooking } from "../../controllers/bookingController.js";
import Booking from "../../models/Booking.js";
import Workspace from "../../models/Workspace.js";
import Notification from "../../models/Notification.js";
import { calculatePrice } from "../../utils/calculatePrice.js";

jest.mock("../../models/Booking.js");
jest.mock("../../models/Workspace.js");
jest.mock("../../models/Notification.js");
jest.mock("../../utils/calculatePrice.js");

describe("createBooking", () => {
  const mockReq = {
    body: {
      workspace: "workspaceId123",
      date: "2025-07-01",
      startTime: "10:00",
      endTime: "12:00",
      isFlexible: false,
      flexibilityRange: 0,
      price: 200,
    },
    user: {
      _id: "user123",
      role: "user",
    },
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("должен создать бронирование при корректных данных", async () => {
    Workspace.findById.mockResolvedValue({
      _id: "workspaceId123",
      isActive: true,
      pricePerHour: 100,
      name: "Рабочее место 1",
    });

    Booking.find.mockResolvedValue([]);
    Booking.findOne.mockResolvedValue(null);
    calculatePrice.mockReturnValue(200);
    Booking.create.mockResolvedValue({ _id: "bookingId123" });
    Notification.create.mockResolvedValue({});

    await createBooking(mockReq, mockRes);

    expect(Workspace.findById).toHaveBeenCalledWith("workspaceId123");
    expect(Booking.create).toHaveBeenCalled();
    expect(Notification.create).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  it("должен вернуть 404, если рабочее место не найдено", async () => {
    Workspace.findById.mockResolvedValue(null);

    await createBooking(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Рабочее место не найдено или отключено",
    });
  });

  it("должен вернуть 400, если цена некорректна", async () => {
    await createBooking(
      { ...mockReq, body: { ...mockReq.body, price: -50 } },
      mockRes
    );

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Неверная стоимость бронирования",
    });
  });

  it("должен вернуть 400, если пользователь уже имеет бронирование", async () => {
    Workspace.findById.mockResolvedValue({
      _id: "workspaceId123",
      isActive: true,
      pricePerHour: 100,
    });

    Booking.find.mockResolvedValue([]);
    Booking.findOne.mockResolvedValue({ _id: "existingBooking" });

    await createBooking(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "У вас уже есть активное бронирование на этот день",
    });
  });
});
