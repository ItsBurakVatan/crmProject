import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    taskNo: { type: Number, required: true },
    adayCari: { type: mongoose.Schema.Types.ObjectId, ref: "AdayCari" },
    taskDate: { type: Date },
    taskEndDate: { type: Date },
    receiptType: { type: mongoose.Schema.Types.ObjectId, ref: "ReceiptType" },
    priority: { type: mongoose.Schema.Types.ObjectId, ref: "Priority" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    taskType: { type: mongoose.Schema.Types.ObjectId, ref: "TaskType" },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    relatedGroup: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    completed: { type: Boolean, default: false },
    description: { type: String }
}, { timestamps: true });

export default mongoose.model("Task", TaskSchema, "tasks");