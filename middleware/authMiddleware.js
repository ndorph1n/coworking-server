import jwt from "jsonwebtoken";
import User from "../models/User.js";

//Middleware для защиты маршрутов (только для авторизованных пользователей)
export const protect = async (req, res, next) => {
  let token;

  // Проверка на наличие токена в заголовке
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Проверка токена и извлечение userId
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Получаем пользователя по id и исключаем пароль
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Пользователь не найден" });
      }

      next();
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      res.status(401).json({ message: "Недопустимый токен" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Токен отсутствует, доступ запрещён" });
  }
};

// Middleware для защиты маршрутов (для получения различной информации, где авторизация не обязательна)
export const protectOptional = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (auth?.startsWith("Bearer")) {
    try {
      const token = auth.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
      req.user = null; // токен недействителен — остаётся аноним
    }
  }

  next();
};
