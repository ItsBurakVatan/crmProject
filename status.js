import express from "express";
import Status from "../models/Status.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const statuses = await Status.find();
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/search", async (req, res) => {
    const { query } = req.query;
    try {
        const statuses = await Status.find({ name: { $regex: query, $options: "i" } });
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/", async (req, res) => {
    const { name } = req.body;
    try {
        const newStatus = new Status({ name });
        await newStatus.save();
        res.json(newStatus);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/:id", async (req, res) => {
    const { name } = req.body;
    try {
        const updatedStatus = await Status.findByIdAndUpdate(req.params.id, { name }, { new: true });
        res.json(updatedStatus);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await Status.findByIdAndDelete(req.params.id);
        res.json({ message: "Status deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;