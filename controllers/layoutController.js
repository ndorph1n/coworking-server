import path from "path";
import fs from "fs";

export const uploadLayoutImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Файл не загружен" });
  }
  res.json({
    message: "План помещения загружен",
    filePath: `/uploads/layout/${req.file.filename}`,
  });
};

export const getLayoutImage = (req, res) => {
  const filePath = path.resolve("uploads/layout/layout.png");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "План помещения не найден" });
  }
  res.sendFile(filePath);
};
