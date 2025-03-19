import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Durum adı zorunlu!"], 
        minlength: [2, "Durum adı en az 2 karakter olmalı!"]
    },
});

export default mongoose.model("Status", statusSchema);
