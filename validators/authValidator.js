import * as z from "zod/v4";

// Схема валидации регистрационных данных
export const registerSchema = z.object({
  firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  phone: z.e164("Некорректный номер телефона"),
  email: z.email("Некорректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

// Схема валидации данных логина
export const loginSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});
