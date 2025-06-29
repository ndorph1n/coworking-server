import User from "../models/User.js";

// Получение профиля пользователя
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ message: "Пользователь не найден" });
  res.json(user);
};

// Обновление профиля пользователя
export const updateUserProfile = async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  const isAdmin = req.user.role === "admin";
  const userId = isAdmin && req.body._id ? req.body._id : req.user._id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "Пользователь не найден" });

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.phone = phone || user.phone;

  await user.save();
  res.json({ message: "Данные пользователя обновлены" });
};

// получение всех пользователей (только для админов)
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// удаление пользователя (только для админов)
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Пользователь не найден" });

  await user.deleteOne();
  res.json({ message: "Пользователь удалён" });
};

// изменение данных пользователя (только для админов)
export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Пользователь не найден" });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;

    await user.save();
    res.json({ message: "Пользователь обновлён", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка обновления пользователя" });
  }
};
