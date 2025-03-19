import express from "express";
import { authorize } from "../middleware/auth.js";
import { createTask, deleteTask, getTasks, searchTasks, updateTask } from "../controllers/tasks.js";
import TaskType from "../models/TaskType.js";
import Priority from "../models/Priority.js";
import ReceiptType from "../models/ReceiptType.js";
import User from "../models/User.js";
import Group from "../models/Group.js";

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

// Sayfalama parametreleri ile görev listeleme ve arama
router.get("/", authorize("admin", "manager", "staff"), getTasks);
router.get("/search", authorize("admin", "manager", "staff"), searchTasks);
router.post("/", authorize("admin", "manager", "staff"), createTask);
router.put("/:id", authorize("admin", "manager", "staff"), updateTask);
router.delete("/:id", authorize("admin", "manager"), deleteTask);

export default router;
