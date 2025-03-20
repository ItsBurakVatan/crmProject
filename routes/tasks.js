import express from "express";
import { authorize } from "../middleware/auth.js";
import { createTask, deleteTask, getTasks, searchTasks, updateTask } from "../controllers/tasks.js";
import Task from "../models/Task.js";
import TaskType from "../models/TaskType.js";
import Priority from "../models/Priority.js";
import ReceiptType from "../models/ReceiptType.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import mongoose from "mongoose";

const router = express.Router();

router.get("/taskTypes", async (req, res) => {
    try {
        const taskTypes = await TaskType.find();
        res.status(200).json(taskTypes);
    } catch (err) {
        res.status(500).json({ message: "Görev türleri alınamadı", error: err.message });
    }
});

router.get("/priorities", async (req, res) => {
    try {
        const priorities = await Priority.find();
        res.status(200).json(priorities);
    } catch (err) {
        res.status(500).json({ message: "Öncelikler alınamadı", error: err.message });
    }
});

router.get("/receiptTypes", async (req, res) => {
    try {
        const receiptTypes = await ReceiptType.find();
        res.status(200).json(receiptTypes);
    } catch (err) {
        res.status(500).json({ message: "Fiş türleri alınamadı", error: err.message });
    }
});

router.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: "Kullanıcılar alınamadı", error: err.message });
    }
});

router.get("/groups", async (req, res) => {
    try {
        const groups = await Group.find();
        res.status(200).json(groups);
    } catch (err) {
        res.status(500).json({ message: "Gruplar alınamadı", error: err.message });
    }
});

// Rapor endpoint'i (kullanıcı bazlı)
router.get("/completion-report", authorize("admin"), async (req, res, next) => {
    try {
        const taskType = await ReceiptType.findOne({ name: "Görev" });
        if (!taskType) {
            return res.status(404).json({ message: "Görev türü bulunamadı" });
        }

        console.log("Task Type ID:", taskType._id); // ReceiptType ID'sini logla
        const tasks = await Task.find({ receiptType: taskType._id });
        console.log("Found Tasks:", tasks); // Bulunan görevleri logla

        if (!tasks || tasks.length === 0) {
            return res.status(200).json({ completed: 0, pending: 0, message: "Görev bulunamadı" });
        }

        const completed = tasks.filter(task => task.completed === true).length;
        const pending = tasks.filter(task => task.completed !== true).length;

        console.log("Completed:", completed, "Pending:", pending); // Sayıları logla
        res.status(200).json({ completed, pending });
    } catch (err) {
        console.error("Completion report error:", err);
        res.status(500).json({ message: "Görev tamamlama raporu alınamadı", error: err.message });
    }
});

// Sayfalama parametreleri ile görev listeleme ve arama
router.get("/", authorize("admin", "manager", "staff"), getTasks);
router.get("/search", authorize("admin", "manager", "staff"), searchTasks);
router.post("/", authorize("admin", "manager", "staff"), createTask);
router.put("/:id", authorize("admin", "manager", "staff"), updateTask);
router.delete("/:id", authorize("admin", "manager"), deleteTask);

export default router;
