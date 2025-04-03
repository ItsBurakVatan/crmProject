import mongoose from "mongoose";

const taskTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Görev türü adı zorunlu!"], 
        minlength: [2, "Görev türü adı en az 2 karakter olmalı!"]
    },
});

// Model zaten tanımlıysa onu döndür, yoksa yeni bir tane oluştur
const TaskType = mongoose.models.TaskType || mongoose.model("TaskType", taskTypeSchema, "taskTypes");

export default TaskType;
