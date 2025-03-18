import express from "express";
import Group from "../models/Group.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/search", async (req, res) => {
    const { query } = req.query;
    try {
        const groups = await Group.find({ name: { $regex: query, $options: "i" } });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/", async (req, res) => {
    const { name } = req.body;
    try {
        const newGroup = new Group({ name });
        await newGroup.save();
        res.json(newGroup);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/:id", async (req, res) => {
    const { name } = req.body;
    try {
        const updatedGroup = await Group.findByIdAndUpdate(req.params.id, { name }, { new: true });
        res.json(updatedGroup);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await Group.findByIdAndDelete(req.params.id);
        res.json({ message: "Group deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
