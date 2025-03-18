import mongoose from "mongoose";
import { createError } from "../error.js";

// Görevleri Listeleme
export const getTasks = async (req, res, next) => {
    try {
        const tasksQuery = req.user.role === "staff" 
            ? { createdBy: new mongoose.Types.ObjectId(req.user.id) } // Personel sadece kendi görevlerini görür
            : {}; // Admin ve manager tüm görevleri görür

        const tasks = await mongoose.connection.db.collection("tasks")
            .aggregate([
                { $match: tasksQuery },
                { $lookup: { from: "adaycaris", localField: "adayCari", foreignField: "_id", as: "adayCari" } },
                { $unwind: { path: "$adayCari", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "receiptTypes", localField: "receiptType", foreignField: "_id", as: "receiptType" } },
                { $unwind: { path: "$receiptType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "priorities", localField: "priority", foreignField: "_id", as: "priority" } },
                { $unwind: { path: "$priority", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "createdBy" } },
                { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "taskTypes", localField: "taskType", foreignField: "_id", as: "taskType" } },
                { $unwind: { path: "$taskType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "relatedUser", foreignField: "_id", as: "relatedUser" } },
                { $unwind: { path: "$relatedUser", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "groups", localField: "relatedGroup", foreignField: "_id", as: "relatedGroup" } },
                { $unwind: { path: "$relatedGroup", preserveNullAndEmptyArrays: true } }
            ])
            .toArray();
        res.status(200).json(tasks);
    } catch (err) {
        next(createError(500, "Görevler alınamadı: " + err.message));
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
            createdBy: req.user.id, // Görevi oluşturan kullanıcı
            adayCari: req.body.adayCari ? new mongoose.Types.ObjectId(req.body.adayCari) : null,
            receiptType: req.body.receiptType ? new mongoose.Types.ObjectId(req.body.receiptType) : null,
            priority: req.body.priority ? new mongoose.Types.ObjectId(req.body.priority) : null,
            taskType: req.body.taskType ? new mongoose.Types.ObjectId(req.body.taskType) : null,
            relatedUser: req.body.relatedUser ? new mongoose.Types.ObjectId(req.body.relatedUser) : null,
            relatedGroup: req.body.relatedGroup ? new mongoose.Types.ObjectId(req.body.relatedGroup) : null,
        };
        const result = await mongoose.connection.db.collection("tasks").insertOne(newTask);
        const insertedTask = await mongoose.connection.db.collection("tasks").findOne({ _id: result.insertedId });
        res.status(201).json(insertedTask);
    } catch (err) {
        next(createError(500, "Görev oluşturulamadı: " + err.message));
    }
};

// Görev Güncelleme
export const updateTask = async (req, res, next) => {
    try {
        const updatedTask = await mongoose.connection.db.collection("tasks").findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.id) },
            { $set: req.body },
            { returnDocument: "after" }
        );
        if (!updatedTask.value) {
            return next(createError(404, "Güncellenecek görev bulunamadı!"));
        }
        // Populate işlemini tekrar yapalım
        const taskWithRelations = await mongoose.connection.db.collection("tasks")
            .aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
                { $lookup: { from: "adaycaris", localField: "adayCari", foreignField: "_id", as: "adayCari" } },
                { $unwind: { path: "$adayCari", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "receiptTypes", localField: "receiptType", foreignField: "_id", as: "receiptType" } },
                { $unwind: { path: "$receiptType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "priorities", localField: "priority", foreignField: "_id", as: "priority" } },
                { $unwind: { path: "$priority", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "createdBy" } },
                { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "taskTypes", localField: "taskType", foreignField: "_id", as: "taskType" } },
                { $unwind: { path: "$taskType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "relatedUser", foreignField: "_id", as: "relatedUser" } },
                { $unwind: { path: "$relatedUser", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "groups", localField: "relatedGroup", foreignField: "_id", as: "relatedGroup" } },
                { $unwind: { path: "$relatedGroup", preserveNullAndEmptyArrays: true } }
            ])
            .toArray();
        res.status(200).json(taskWithRelations[0]);
    } catch (err) {
        next(createError(500, "Görev güncellenemedi: " + err.message));
    }
};

// Görev Silme
export const deleteTask = async (req, res, next) => {
    try {
        const result = await mongoose.connection.db.collection("tasks").deleteOne({
            _id: new mongoose.Types.ObjectId(req.params.id)
        });
        if (result.deletedCount === 0) {
            return next(createError(404, "Silinecek görev bulunamadı!"));
        }
        res.status(200).json({ message: "Görev başarıyla silindi." });
    } catch (err) {
        next(createError(500, "Görev silinemedi: " + err.message));
    }
};

// Görev Arama
export const searchTasks = async (req, res, next) => {
    try {
        const query = req.query.query;
        const tasksQuery = req.user.role === "staff" 
            ? { 
                createdBy: new mongoose.Types.ObjectId(req.user.id), 
                $or: [
                    { description: { $regex: query, $options: "i" } },
                    { "adayCari.chUnvani": { $regex: query, $options: "i" } }
                ]
              }
            : { 
                $or: [
                    { description: { $regex: query, $options: "i" } },
                    { "adayCari.chUnvani": { $regex: query, $options: "i" } }
                ]
              };

        const tasks = await mongoose.connection.db.collection("tasks")
            .aggregate([
                { $lookup: { from: "adaycaris", localField: "adayCari", foreignField: "_id", as: "adayCari" } },
                { $unwind: { path: "$adayCari", preserveNullAndEmptyArrays: true } },
                { $match: tasksQuery },
                { $lookup: { from: "receiptTypes", localField: "receiptType", foreignField: "_id", as: "receiptType" } },
                { $unwind: { path: "$receiptType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "priorities", localField: "priority", foreignField: "_id", as: "priority" } },
                { $unwind: { path: "$priority", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "createdBy" } },
                { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "taskTypes", localField: "taskType", foreignField: "_id", as: "taskType" } },
                { $unwind: { path: "$taskType", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "relatedUser", foreignField: "_id", as: "relatedUser" } },
                { $unwind: { path: "$relatedUser", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "groups", localField: "relatedGroup", foreignField: "_id", as: "relatedGroup" } },
                { $unwind: { path: "$relatedGroup", preserveNullAndEmptyArrays: true } }
            ])
            .toArray();
        res.status(200).json(tasks);
    } catch (err) {
        next(createError(500, "Görevler aranırken hata oluştu: " + err.message));
    }
};
