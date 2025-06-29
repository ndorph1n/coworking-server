import Notification from "../models/Notification.js";

// Получение уведомлений пользователя
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      deleted: false,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении уведомлений" });
  }
};

// Отметка уведомления как прочитанного
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Уведомление не найдено" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при обновлении уведомления" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Уведомление не найдено" });
    }

    notification.deleted = true;
    await notification.save();

    res.status(200).json({ message: "Уведомление удалено" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при удалении уведомления" });
  }
};
