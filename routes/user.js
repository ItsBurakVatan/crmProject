import express from "express";
import { register, login, getUsers, updateUserRole } from "../controllers/user.js";
import { authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/", authorize("admin"), getUsers); // Kullanıcıları listele
router.put("/:id/role", authorize("admin"), updateUserRole); // Rol güncelle

export default router;
