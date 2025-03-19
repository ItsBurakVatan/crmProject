import mongoose from "mongoose";

const prioritySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Öncelik adı zorunlu!"], 
        minlength: [2, "Öncelik adı en az 2 karakter olmalı!"]
    }
});

export default mongoose.model("Priority", prioritySchema, "priorities");
