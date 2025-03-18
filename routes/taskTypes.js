import express from "express";
import TaskType from "../models/TaskType.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const taskTypes = await TaskType.find();
        res.json(taskTypes);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/search", async (req, res) => {
    const { query } = req.query;
    try {
        const taskTypes = await TaskType.find({ name: { $regex: query, $options: "i" } });
        res.json(taskTypes);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/", async (req, res) => {
    const { name } = req.body;
    try {
        const newTaskType = new TaskType({ name });
        await newTaskType.save();
        res.json(newTaskType);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/:id", async (req, res) => {
    const { name } = req.body;
    try {
        const updatedTaskType = await TaskType.findByIdAndUpdate(req.params.id, { name }, { new: true });
        res.json(updatedTaskType);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await TaskType.findByIdAndDelete(req.params.id);
        res.json({ message: "Task type deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
