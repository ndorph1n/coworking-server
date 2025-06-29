import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingsByWorkspace,
  cancelBooking,
  getAllBookings,
  markCompletedBookings,
  extendBooking,
} from "../controllers/bookingController.js";
import { protect, protectOptional } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);

router.get("/mine", protect, getMyBookings);

router.get("/workspace/:id", protectOptional, getBookingsByWorkspace);

router.patch("/:id/cancel", protect, cancelBooking);

router.patch("/mark-completed", protect, isAdmin, markCompletedBookings);

router.get("/", protect, isAdmin, getAllBookings);

router.patch("/:id/extend", protect, isAdmin, extendBooking);

export default router;
