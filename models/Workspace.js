import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["desk", "meeting_room", "office"],
      default: "desk",
    },
    location: { type: String }, // Локация, например, "Этаж 1"
    pricePerHour: { type: Number, required: true },
    capacity: { type: Number, default: 1 }, // Кол-во людей, которых вмещает
    images: [{ type: String }], // Ссылки на изображения
    features: [{ type: String }], // Пример: ["проектор",""Wi-Fi", "доска для заметок"]
    coordinates: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }, // Координаты для размещения на плане офиса
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
