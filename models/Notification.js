import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    type: { type: String },
    read: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false }, // 👈 добавлено поле
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
