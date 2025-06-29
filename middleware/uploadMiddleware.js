import multer from "multer";
import path from "path";
import fs from "fs";

// Папка для хранения плана
const storagePath = "uploads/layout";

fs.mkdirSync(storagePath, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storagePath);
  },
  filename: function (req, file, cb) {
    cb(null, "layout" + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png"];
  cb(null, allowed.includes(file.mimetype));
};

export const uploadLayout = multer({ storage, fileFilter });

export const uploadWorkspaceImages = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const workspaceId = req.params.id;
      const dir = `uploads/workspaces/${workspaceId}`;
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const workspaceId = req.params.id;
      const dir = `uploads/workspaces/${workspaceId}`;
      const existingFiles = fs
        .readdirSync(dir)
        .filter((name) => /^photo-\d+/.test(name));
      const nextNumber = existingFiles.length + 1;
      cb(null, `photo-${nextNumber}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});
