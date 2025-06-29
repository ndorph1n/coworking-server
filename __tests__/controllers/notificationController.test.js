import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../../controllers/notificationController.js";

import Notification from "../../models/Notification.js";

jest.mock("../../models/Notification.js", () => {
  const find = jest.fn();
  const findOne = jest.fn();
  const findOneAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: {
      find,
      findOne,
      findOneAndUpdate,
    },
  };
});

describe("notificationController", () => {
  const mockUserId = "user123";
  const req = {
    user: { _id: mockUserId },
    params: { id: "notif456" },
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserNotifications", () => {
    it("должен вернуть список уведомлений", async () => {
      const mockData = [{ message: "Уведомление 1" }, { message: "Уведомление 2" }];
      Notification.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockData),
      });

      await getUserNotifications(req, res);

      expect(Notification.find).toHaveBeenCalledWith({
        user: mockUserId,
        deleted: false,
      });
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("должен обработать ошибку", async () => {
      Notification.find.mockImplementation(() => {
        throw new Error("Ошибка");
      });

      await getUserNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ошибка при получении уведомлений",
      });
    });
  });

  describe("markNotificationAsRead", () => {
    it("должен отметить уведомление как прочитанное", async () => {
      const updatedNotification = { message: "Обновлённое уведомление" };
      Notification.findOneAndUpdate.mockResolvedValue(updatedNotification);

      await markNotificationAsRead(req, res);

      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "notif456", user: mockUserId },
        { read: true },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedNotification);
    });

    it("должен вернуть 404, если уведомление не найдено", async () => {
      Notification.findOneAndUpdate.mockResolvedValue(null);

      await markNotificationAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Уведомление не найдено" });
    });

    it("должен обработать ошибку", async () => {
      Notification.findOneAndUpdate.mockRejectedValue(new Error("Ошибка"));

      await markNotificationAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ошибка при обновлении уведомления",
      });
    });
  });

  describe("deleteNotification", () => {
    it("должен пометить уведомление как удалённое", async () => {
      const mockSave = jest.fn().mockResolvedValue();
      Notification.findOne.mockResolvedValue({ deleted: false, save: mockSave });

      await deleteNotification(req, res);

      expect(Notification.findOne).toHaveBeenCalledWith({
        _id: "notif456",
        user: mockUserId,
      });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Уведомление удалено" });
    });

    it("должен вернуть 404, если уведомление не найдено", async () => {
      Notification.findOne.mockResolvedValue(null);

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Уведомление не найдено" });
    });

    it("должен обработать ошибку", async () => {
      Notification.findOne.mockRejectedValue(new Error("Ошибка"));

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ошибка при удалении уведомления",
      });
    });
  });
});
