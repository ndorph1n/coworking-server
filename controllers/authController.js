import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

// Функция для регистрации нового пользователя
export const registerUser = async (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body;

  try {
    // Проверка: существует ли уже такой email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }

    // Создание нового пользователя
    const user = await User.create({
      firstName,
      lastName,
      phone,
      email,
      password, // пароль захешируется в pre-save
    });

    // Ответ с JWT
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Функция для входа пользователя
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Поиск пользователя по email
    const user = await User.findOne({ email });

    // Проверка: существует ли пользователь и совпадает ли пароль
    if (user && (await user.matchPassword(password))) {
      return res.status(200).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }
  } catch (error) {
    console.error("Ошибка при входе:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
