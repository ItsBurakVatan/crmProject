import mongoose from "mongoose";

const taskTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Görev türü adı zorunlu!"], 
        minlength: [2, "Görev türü adı en az 2 karakter olmalı!"]
    },
});

export default mongoose.model("TaskType", taskTypeSchema, "taskTypes");
