import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Grup adı zorunlu!"], 
        minlength: [2, "Grup adı en az 2 karakter olmalı!"]
    },
});

export default mongoose.model("Group", groupSchema);
