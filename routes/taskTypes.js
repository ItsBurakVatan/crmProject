import express from "express";
import TaskType from "../models/taskType.js"; // Model adı büyük harfle (TaskType) uyumlu hale getirildi
import { ApiError } from "../error.js"; // Doğru yol: utils/error.js
import { verifyToken, authorize } from "../middleware/auth.js";
import logger from "../utils/logger.js"; // Logger eklendi

const router = express.Router();

// Tüm görev türlerini listele (herkes erişebilir)
router.get("/", async (req, res, next) => {
    try {
        const taskTypes = await TaskType.find();
        logger.info("Görev türleri listelendi:", taskTypes.length);
        res.json(taskTypes);
    } catch (error) {
        logger.error("Görev türleri alınamadı:", error.message);
        next(ApiError.internal("Sunucu hatası, lütfen daha sonra tekrar deneyin.", { error: error.message }));
    }
});

// Görev türü ara (herkes erişebilir)
router.get("/search", async (req, res, next) => {
    const { query } = req.query;
    try {
        const taskTypes = await TaskType.find({ name: { $regex: query, $options: "i" } });
        logger.info("Görev türü araması yapıldı:", { query, found: taskTypes.length });
        res.json(taskTypes);
    } catch (error) {
        logger.error("Görev türü aranamadı:", error.message);
        next(ApiError.internal("Sunucu hatası, lütfen daha sonra tekrar deneyin.", { error: error.message }));
    }
});

// Yeni görev türü ekle (sadece admin ve manager)
router.post("/", verifyToken, authorize("admin", "manager"), async (req, res, next) => {
    const { name } = req.body;
    try {
        if (!name) throw ApiError.badRequest("Görev türü adı gerekli!");
        const newTaskType = new TaskType({ name });
        await newTaskType.save();
        logger.info("Yeni görev türü eklendi:", newTaskType._id);
        res.status(201).json(newTaskType);
    } catch (error) {
        logger.error("Görev türü eklenemedi:", error.message);
        next(error instanceof ApiError ? error : ApiError.internal("Sunucu hatası, lütfen daha sonra tekrar deneyin.", { error: error.message }));
    }
});

// Görev türünü güncelle (sadece admin ve manager)
router.put("/:id", verifyToken, authorize("admin", "manager"), async (req, res, next) => {
    const { name } = req.body;
    try {
        if (!name) throw ApiError.badRequest("Görev türü adı gerekli!");
        const updatedTaskType = await TaskType.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );
        if (!updatedTaskType) throw ApiError.notFound("Görev türü bulunamadı!");
        logger.info("Görev türü güncellendi:", updatedTaskType._id);
        res.json(updatedTaskType);
    } catch (error) {
        logger.error("Görev türü güncellenemedi:", error.message);
        next(error instanceof ApiError ? error : ApiError.internal("Sunucu hatası, lütfen daha sonra tekrar deneyin.", { error: error.message }));
    }
});

// Görev türünü sil (sadece admin ve manager)
router.delete("/:id", verifyToken, authorize("admin", "manager"), async (req, res, next) => {
    try {
        const deletedTaskType = await TaskType.findByIdAndDelete(req.params.id);
        if (!deletedTaskType) throw ApiError.notFound("Görev türü bulunamadı!");
        logger.info("Görev türü silindi:", req.params.id);
        res.json({ message: "Görev türü silindi." });
    } catch (error) {
        logger.error("Görev türü silinemedi:", error.message);
        next(error instanceof ApiError ? error : ApiError.internal("Sunucu hatası, lütfen daha sonra tekrar deneyin.", { error: error.message }));
    }
});

export default router;
