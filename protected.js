import express from "express";
import verifyToken from "../middleware/jwtAuth.js";

const router = express.Router();

// Korunan rota (JWT doğrulaması gerekiyor)
router.get("/protected", verifyToken, (req, res) => {
    res.json({ message: "Protected data", user: req.user });
});

export default router;
