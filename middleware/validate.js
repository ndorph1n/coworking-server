import * as z from "zod/v4";

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0].message });
    }

    console.error("Ошибка валидации:", err);
    return res.status(500).json({ message: "Ошибка валидации данных" });
  }
};
