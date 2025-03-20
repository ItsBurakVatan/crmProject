import express from "express";
import Role from "../models/Role.js";

const router = express.Router();

// Tüm rolleri getir
router.get("/", async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (err) {
        res.status(500).json({ success: false, message: "Roller alınamadı!", error: err.message });
    }
});

export default router;