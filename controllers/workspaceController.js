import Workspace from "../models/Workspace.js";
import path from "path";
import fs from "fs";

// Получить все рабочие места
export const getAllWorkspaces = async (req, res) => {
  try {
    // Извлечение параметров фильтрации из запроса
    const { type, features, priceMin, priceMax, capacityMin, capacityMax, sort } =
      req.query;
    // Базовый фильтр для активных рабочих мест
    const query = { isActive: true };

    // Применение фильтров, если они указаны
    if (type) {
      query.type = type;
    }

    if (priceMin || priceMax) {
      query.pricePerHour = {};
      if (priceMin) query.pricePerHour.$gte = Number(priceMin);
      if (priceMax) query.pricePerHour.$lte = Number(priceMax);
    }

    if (capacityMin || capacityMax) {
      query.capacity = {};
      if (capacityMin) query.capacity.$gte = Number(capacityMin);
      if (capacityMax) query.capacity.$lte = Number(capacityMax);
    }

    if (features) {
      const featuresArray = features.split(",");
      query.features = { $all: featuresArray };
    }

    // Обработка сортировки
    let sortOption = {};
    if (sort === "price_asc") sortOption.pricePerHour = 1;
    if (sort === "price_desc") sortOption.pricePerHour = -1;

    const workspaces = await Workspace.find(query).sort(sortOption);

    res.json(workspaces);
  } catch (error) {
    console.error("Ошибка при фильтрации рабочих мест:", error);
    res.status(500).json({ message: "Ошибка при получении рабочих мест" });
  }
};

// Все рабочие места для админа
export const getAllWorkspacesForAdmin = async (req, res) => {
  try {
    const { type, features, priceMin, priceMax, capacityMin, capacityMax, sort } =
      req.query;
    const query = {}; // 👈 никаких ограничений по активности

    if (type) {
      query.type = type;
    }

    if (priceMin || priceMax) {
      query.pricePerHour = {};
      if (priceMin) query.pricePerHour.$gte = Number(priceMin);
      if (priceMax) query.pricePerHour.$lte = Number(priceMax);
    }

    if (capacityMin || capacityMax) {
      query.capacity = {};
      if (capacityMin) query.capacity.$gte = Number(capacityMin);
      if (capacityMax) query.capacity.$lte = Number(capacityMax);
    }

    if (features) {
      const featuresArray = features.split(",");
      query.features = { $all: featuresArray };
    }

    let sortOption = {};
    if (sort === "price_asc") sortOption.pricePerHour = 1;
    if (sort === "price_desc") sortOption.pricePerHour = -1;

    const workspaces = await Workspace.find(query).sort(sortOption);

    res.json(workspaces);
  } catch (error) {
    console.error("Ошибка при получении всех рабочих мест для админа:", error);
    res.status(500).json({ message: "Ошибка при получении рабочих мест" });
  }
};

// Получить рабочее место по ID
export const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace || !workspace.isActive) {
      return res.status(404).json({ message: "Рабочее место не найдено" });
    }
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении рабочего места" });
  }
};

// Создать новое рабочее место
export const createWorkspace = async (req, res) => {
  try {
    const workspace = new Workspace(req.body);
    const created = await workspace.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при создании рабочего места" });
  }
};

// Обновить рабочее место
export const updateWorkspace = async (req, res) => {
  try {
    const updated = await Workspace.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Рабочее место не найдено" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при обновлении" });
  }
};

// Мягкое удаление рабочего места
export const handleActivationWorkpsace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: "Рабочее место не найдено" });
    }
    workspace.isActive ? (workspace.isActive = false) : (workspace.isActive = true);
    await workspace.save();

    res.json({ message: "Рабочее место деактивировано" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при активации/деактивации рабочего места" });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: "Рабочее место не найдено" });
    }

    await workspace.deleteOne();

    const folderPath = path.resolve(`uploads/workspaces/${req.params.id}`);

    try {
      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
      }
    } catch (fsErr) {
      console.error("Ошибка при удалении папки с файлами:", fsErr.message);
      // Не блокируем основной поток
    }

    res.json({ message: "Рабочее место полностью удалено" });
  } catch (error) {
    console.error("Ошибка при удалении рабочего места:", error.message);
    res.status(500).json({ message: "Ошибка при удалении рабочего места" });
  }
};

// Загрузка изображений для рабочего места
export const uploadWorkspacePhotos = async (req, res) => {
  const { id } = req.params;
  const workspace = await Workspace.findById(id);
  if (!workspace)
    return res.status(404).json({ message: "Рабочее место не найдено" });

  const imagePaths = req.files.map(
    (file) => `/uploads/workspaces/${id}/${file.filename}`
  );
  workspace.images.push(...imagePaths);
  await workspace.save();

  res.json({ message: "Фотографии добавлены", images: workspace.images });
};
