import express from "express";
import { authorize } from "../middleware/auth.js";
import { getTasks, createTask, updateTask, deleteTask, searchTasks } from "../controllers/tasks.js";
import mongoose from "mongoose"; // Mongoose'u import ediyoruz, eğer dosyanın başında yoksa eklenmeli

const router = express.Router();

// Görevleri Listeleme
router.get("/", authorize("admin", "manager", "staff"), getTasks);

// Yeni Görev Oluşturma
router.post("/", authorize("admin", "manager", "staff"), createTask);

// Görev Güncelleme
router.put("/:id", authorize("admin", "manager"), updateTask);

// Görev Silme
router.delete("/:id", authorize("admin"), deleteTask);

// Görev Arama
router.get("/search", authorize("admin", "manager", "staff"), searchTasks);

// Ekstra Endpoint’ler (Tanımlamalar için)
router.get("/taskTypes", async (req, res) => {
    try {
        const taskTypes = await mongoose.connection.db.collection("taskTypes").find().toArray();
        console.log("Task Types:", taskTypes); // Backend logu
        res.status(200).json(taskTypes);
    } catch (err) {
        console.error("Error fetching taskTypes:", err); // Hata detayını logla
        res.status(500).json({ message: "Task types alınamadı", error: err.message });
    }
});

router.get("/priorities", async (req, res) => {
    try {
        const priorities = await mongoose.connection.db.collection("priorities").find().toArray();
        console.log("Priorities:", priorities);
        res.status(200).json(priorities);
    } catch (err) {
        console.error("Error fetching priorities:", err);
        res.status(500).json({ message: "Priorities alınamadı", error: err.message });
    }
});

router.get("/receiptTypes", async (req, res) => {
    try {
        const receiptTypes = await mongoose.connection.db.collection("receiptTypes").find().toArray();
        console.log("Receipt Types:", receiptTypes);
        res.status(200).json(receiptTypes);
    } catch (err) {
        console.error("Error fetching receiptTypes:", err);
        res.status(500).json({ message: "Receipt types alınamadı", error: err.message });
    }
});

router.get("/users", async (req, res) => {
    try {
        const users = await mongoose.connection.db.collection("users").find().toArray();
        console.log("Users:", users);
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Users alınamadı", error: err.message });
    }
});

export default router;