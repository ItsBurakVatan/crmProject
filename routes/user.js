import express from "express";
import { register, login, getUsers, updateUserRole } from "../controllers/user.js";
import { authorize, verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import ReceiptType from "../models/ReceiptType.js"; // TaskType yerine ReceiptType
import mongoose from "mongoose";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/", authorize("admin"), getUsers);
router.put("/:id/role", authorize("admin"), updateUserRole);

router.get("/:userId/activity-report", authorize("admin"), async (req, res, next) => {
    try {
        console.log("Starting activity report for user:", req.params.userId);

        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(400).json({ message: "Geçersiz kullanıcı ID'si" });
        }

        const activityType = await ReceiptType.findOne({ name: "Aktivite" });
        console.log("Activity Type:", activityType);
        if (!activityType) {
            console.log("No activity type found for 'Aktivite'");
            return res.status(404).json({ message: "Aktivite türü bulunamadı" });
        }

        const tasks = await Task.find({ receiptType: activityType._id, createdBy: req.params.userId }); // taskType yerine receiptType
        console.log("Activities:", tasks);
        const totalActivity = tasks.length;
        const activeUsers = 1;

        res.status(200).json({ activeUsers, totalActivity });
    } catch (err) {
        console.error("Activity report error:", err);
        res.status(500).json({ message: "Kullanıcı aktivite raporu alınamadı", error: err.message });
    }
});

export default router;
