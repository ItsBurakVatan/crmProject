import express from "express";
import Status from "../models/status.js";
import { authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const statuses = await Status.find();
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ message: "Durumlar alınamadı", error: error.message });
    }
});

router.get("/search", async (req, res) => {
    const { query } = req.query;
    try {
        const statuses = await Status.find({ name: { $regex: query, $options: "i" } });
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ message: "Durumlar aranırken hata oluştu", error: error.message });
    }
});

router.post("/", authorize("admin", "manager"), async (req, res) => {
    const { name } = req.body;
    try {
        const newStatus = new Status({ name });
        await newStatus.save();
        res.json(newStatus);
    } catch (error) {
        res.status(500).json({ message: "Durum eklenemedi", error: error.message });
    }
});

router.put("/:id", authorize("admin", "manager"), async (req, res) => {
    const { name } = req.body;
    try {
        const updatedStatus = await Status.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updatedStatus) return res.status(404).json({ message: "Durum bulunamadı" });
        res.json(updatedStatus);
    } catch (error) {
        res.status(500).json({ message: "Durum güncellenemedi", error: error.message });
    }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
    try {
        const deletedStatus = await Status.findByIdAndDelete(req.params.id);
        if (!deletedStatus) return res.status(404).json({ message: "Durum bulunamadı" });
        res.json({ message: "Durum silindi" });
    } catch (error) {
        res.status(500).json({ message: "Durum silinemedi", error: error.message });
    }
});

export default router;
