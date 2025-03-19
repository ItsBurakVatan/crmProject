import express from "express";
import Group from "../models/Group.js";
import { authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: "Gruplar alınamadı", error: error.message });
    }
});

router.get("/search", async (req, res) => {
    const { query } = req.query;
    try {
        const groups = await Group.find({ name: { $regex: query, $options: "i" } });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: "Gruplar aranırken hata oluştu", error: error.message });
    }
});

router.post("/", authorize("admin", "manager"), async (req, res) => {
    const { name } = req.body;
    try {
        const newGroup = new Group({ name });
        await newGroup.save();
        res.json(newGroup);
    } catch (error) {
        res.status(500).json({ message: "Grup eklenemedi", error: error.message });
    }
});

router.put("/:id", authorize("admin", "manager"), async (req, res) => {
    const { name } = req.body;
    try {
        const updatedGroup = await Group.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updatedGroup) return res.status(404).json({ message: "Grup bulunamadı" });
        res.json(updatedGroup);
    } catch (error) {
        res.status(500).json({ message: "Grup güncellenemedi", error: error.message });
    }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
    try {
        const deletedGroup = await Group.findByIdAndDelete(req.params.id);
        if (!deletedGroup) return res.status(404).json({ message: "Grup bulunamadı" });
        res.json({ message: "Grup silindi" });
    } catch (error) {
        res.status(500).json({ message: "Grup silinemedi", error: error.message });
    }
});

export default router;
