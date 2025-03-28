import mongoose from "mongoose";
import { ApiError } from "../error.js"; // Yeni ApiError import edildi
import Task from "../models/Task.js"; // Modeli import et
import logger from "../utils/logger.js"; // Logger eklendi

// Görevleri Listeleme
export const getTasks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const tasksQuery = req.user.role === "staff"
            ? { createdBy: req.user.id } // String olarak filtrele
            : {};

        logger.info("req.user.id:", req.user.id);
        logger.info("Tasks Query:", tasksQuery);
        const total = await mongoose.connection.db.collection("tasks").countDocuments(tasksQuery);
        const tasks = await mongoose.connection.db.collection("tasks")
            .aggregate([
                { $match: tasksQuery },
                { $lookup: { from: "adaycaris", localField: "adayCari", foreignField: "_id", as: "adayCari" } },
                { $unwind: { path: "$adayCari", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "receipttypes", localField: "receiptType", foreignField: "_id", as: "receiptType" } }, // receiptTypes koleksiyon adı lowercase
                { $unwind: { path: "$receiptType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "priorities", localField: "priority", foreignField: "_id", as: "priority" } },
                { $unwind: { path: "$priority", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "createdBy" } },
                { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "tasktypes", localField: "taskType", foreignField: "_id", as: "taskType" } }, // taskTypes lowercase
                { $unwind: { path: "$taskType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "relatedUser", foreignField: "_id", as: "relatedUser" } },
                { $unwind: { path: "$relatedUser", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "groups", localField: "relatedGroup", foreignField: "_id", as: "relatedGroup" } },
                { $unwind: { path: "$relatedGroup", preserveNullAndEmptyArrays: true } },
            ])
            .skip(skip)
            .limit(limit)
            .toArray();

        logger.info("Fetched Tasks:", tasks.length);
        res.status(200).json({
            data: tasks,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        logger.error("Görevler alınamadı:", err.message);
        next(ApiError.internal("Görevler alınamadı!", { error: err.message }));
    }
};

// Yeni Görev Oluşturma
export const createTask = async (req, res, next) => {
    try {
        const lastTask = await mongoose.connection.db.collection("tasks").findOne({}, { sort: { taskNo: -1 } });
        const newTaskNo = lastTask ? lastTask.taskNo + 1 : 1;

        const newTask = {
            ...req.body,
            taskNo: newTaskNo,
            createdBy: new mongoose.Types.ObjectId(req.user.id),
            adayCari: req.body.adayCari ? new mongoose.Types.ObjectId(req.body.adayCari) : null,
            receiptType: req.body.receiptType ? new mongoose.Types.ObjectId(req.body.receiptType) : null,
            priority: req.body.priority ? new mongoose.Types.ObjectId(req.body.priority) : null,
            taskType: req.body.taskType ? new mongoose.Types.ObjectId(req.body.taskType) : null,
            relatedUser: req.body.relatedUser ? new mongoose.Types.ObjectId(req.body.relatedUser) : null,
            relatedGroup: req.body.relatedGroup ? new mongoose.Types.ObjectId(req.body.relatedGroup) : null,
        };

        const result = await mongoose.connection.db.collection("tasks").insertOne(newTask);
        const insertedTask = await mongoose.connection.db.collection("tasks").findOne({ _id: result.insertedId });
        logger.info("Yeni görev oluşturuldu:", insertedTask._id);
        res.status(201).json(insertedTask);
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.keys(err.errors).map((key) => ({
                field: key,
                message: err.errors[key].message,
            }));
            return next(ApiError.badRequest("Geçersiz veri girişi!", errors));
        }
        if (err.code === 11000) {
            return next(ApiError.badRequest("Bu görev numarası zaten kullanılıyor!"));
        }
        logger.error("Görev oluşturulamadı:", err.message);
        next(ApiError.internal("Görev oluşturulamadı!", { error: err.message }));
    }
};

// Görev Güncelleme
export const updateTask = async (req, res, next) => {
    try {
        const taskId = req.params.id;
        logger.info("Updating task:", taskId, "with data:", req.body);

        const existingTask = await Task.findById(taskId);
        if (!existingTask) {
            throw ApiError.notFound("Güncellenecek görev bulunamadı!");
        }

        const updateData = {
            taskNo: existingTask.taskNo,
            createdBy: existingTask.createdBy,
            ...req.body,
        };

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        const taskWithRelations = await Task.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(taskId) } },
            { $lookup: { from: "adaycaris", localField: "adayCari", foreignField: "_id", as: "adayCari" } },
            { $unwind: { path: "$adayCari", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "receipttypes", localField: "receiptType", foreignField: "_id", as: "receiptType" } },
            { $unwind: { path: "$receiptType", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "priorities", localField: "priority", foreignField: "_id", as: "priority" } },
            { $unwind: { path: "$priority", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "createdBy" } },
            { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "tasktypes", localField: "taskType", foreignField: "_id", as: "taskType" } },
            { $unwind: { path: "$taskType", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "users", localField: "relatedUser", foreignField: "_id", as: "relatedUser" } },
            { $unwind: { path: "$relatedUser", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "groups", localField: "relatedGroup", foreignField: "_id", as: "relatedGroup" } },
            { $unwind: { path: "$relatedGroup", preserveNullAndEmptyArrays: true } },
        ]);

        logger.info("Görev güncellendi:", taskId);
        res.status(200).json(taskWithRelations[0]);
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.keys(err.errors).map((key) => ({
                field: key,
                message: err.errors[key].message,
            }));
            return next(ApiError.badRequest("Geçersiz veri girişi!", errors));
        }
        if (err.code === 11000) {
            return next(ApiError.badRequest("Bu görev numarası zaten kullanılıyor!"));
        }
        logger.error("Görev güncellenemedi:", err.message);
        next(err instanceof ApiError ? err : ApiError.internal("Görev güncellenemedi!", { error: err.message }));
    }
};

// Görev Silme
export const deleteTask = async (req, res, next) => {
    try {
        const result = await mongoose.connection.db.collection("tasks").deleteOne({
            _id: new mongoose.Types.ObjectId(req.params.id),
        });
        if (result.deletedCount === 0) {
            throw ApiError.notFound("Silinecek görev bulunamadı!");
        }
        logger.info("Görev silindi:", req.params.id);
        res.status(200).json({ message: "Görev başarıyla silindi." });
    } catch (err) {
        logger.error("Görev silinemedi:", err.message);
        next(err instanceof ApiError ? err : ApiError.internal("Görev silinemedi!", { error: err.message }));
    }
};

// Görev Arama
export const searchTasks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = req.query.query;

        const tasksQuery = req.user.role === "staff"
            ? {
                  createdBy: new mongoose.Types.ObjectId(req.user.id),
                  $or: [
                      { description: { $regex: query, $options: "i" } },
                      { "adayCari.chUnvani": { $regex: query, $options: "i" } },
                  ],
              }
            : {
                  $or: [
                      { description: { $regex: query, $options: "i" } },
                      { "adayCari.chUnvani": { $regex: query, $options: "i" } },
                  ],
              };

        const total = await mongoose.connection.db.collection("tasks")
            .aggregate([
                { $lookup: { from: "adaycaris", localField: "adayCari", foreignField: "_id", as: "adayCari" } },
                { $unwind: { path: "$adayCari", preserveNullAndEmptyArrays: true } },
                { $match: tasksQuery },
            ])
            .toArray()
            .then((results) => results.length);

        const tasks = await mongoose.connection.db.collection("tasks")
            .aggregate([
                { $lookup: { from: "adaycaris", localField: "adayCari", foreignField: "_id", as: "adayCari" } },
                { $unwind: { path: "$adayCari", preserveNullAndEmptyArrays: true } },
                { $match: tasksQuery },
                { $lookup: { from: "receipttypes", localField: "receiptType", foreignField: "_id", as: "receiptType" } },
                { $unwind: { path: "$receiptType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "priorities", localField: "priority", foreignField: "_id", as: "priority" } },
                { $unwind: { path: "$priority", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "createdBy" } },
                { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "tasktypes", localField: "taskType", foreignField: "_id", as: "taskType" } },
                { $unwind: { path: "$taskType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "relatedUser", foreignField: "_id", as: "relatedUser" } },
                { $unwind: { path: "$relatedUser", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "groups", localField: "relatedGroup", foreignField: "_id", as: "relatedGroup" } },
                { $unwind: { path: "$relatedGroup", preserveNullAndEmptyArrays: true } },
            ])
            .skip(skip)
            .limit(limit)
            .toArray();

        logger.info("Arama sonuçları:", tasks.length);
        res.status(200).json({
            data: tasks,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        logger.error("Görevler aranırken hata oluştu:", err.message);
        next(ApiError.internal("Görevler aranırken hata oluştu!", { error: err.message }));
    }
};
