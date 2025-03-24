import express from "express";
import { register, login, updateUserRole } from "../controllers/user.js"; // getUsers'ı kaldırdım
import { authorize, verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import ReceiptType from "../models/ReceiptType.js";
import AdayCari from "../models/AdayCari.js";
import TaskType from "../models/TaskType.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/:id/role", authorize("admin"), updateUserRole);

router.get("/", authorize("admin"), async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role } = req.query;
        console.log("Backend Query:", { page, limit, search, role }); // Gelen parametreleri logla
        const query = {};
        if (search) query.$or = [{ username: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
        if (role) query.role = role;

        console.log("MongoDB Query:", query); // MongoDB'ye gönderilen sorguyu logla
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        console.log("Filtrelenmiş Kullanıcılar:", users); // Dönen kullanıcıları logla
        res.status(200).json({ data: users, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error("Hata:", err.message);
        res.status(500).json({ message: "Kullanıcılar alınamadı!", error: err.message });
    }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Kullanıcı silindi." });
    } catch (err) {
        res.status(500).json({ message: "Kullanıcı silinemedi!", error: err.message });
    }
});

router.get("/:id/details", authorize("admin"), async (req, res) => {
    try {
        console.log("User ID:", req.params.id);
        const user = await User.findById(req.params.id);
        if (!user) {
            console.log("Kullanıcı bulunamadı:", req.params.id);
            return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
        }
        console.log("Kullanıcı bulundu:", user.username);

        const taskCount = await mongoose.connection.db.collection("tasks").countDocuments({ 
            createdBy: req.params.id
        });
        console.log("Task Count:", taskCount);

        const activityTaskType = await TaskType.findOne({ name: "aktivite" });
        const activityCount = activityTaskType
            ? await mongoose.connection.db.collection("tasks").countDocuments({ 
                createdBy: req.params.id,
                taskType: activityTaskType._id
              })
            : 0;
        console.log("Activity Count:", activityCount);

        const adayCariCount = await AdayCari.countDocuments({ 
            company: new mongoose.Types.ObjectId(req.params.id)
        });
        console.log("Aday Cari Count:", adayCariCount);

        const response = {
            ...user._doc,
            taskCount,
            activityCount,
            adayCariCount
        };
        console.log("Gönderilen yanıt:", response);

        res.status(200).json(response);
    } catch (err) {
        console.error("Hata:", err.message);
        res.status(500).json({ message: "Detaylar alınamadı!", error: err.message });
    }
});

router.put("/:id/toggle-active", authorize("admin"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
        const newIsActive = req.body.isActive !== undefined ? req.body.isActive : true;
        const updatedUser = await User.findByIdAndUpdate(req.params.id, { isActive: newIsActive }, { new: true });
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: "Durum güncellenemedi!", error: err.message });
    }
});

router.get("/:userId/activity-report", authorize("admin"), async (req, res) => {
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

        const tasks = await Task.find({ receiptType: activityType._id, createdBy: req.params.userId });
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
