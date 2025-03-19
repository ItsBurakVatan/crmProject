import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Şube adı zorunlu!"], 
        minlength: [2, "Şube adı en az 2 karakter olmalı!"]
    },
});

export default mongoose.model("Branch", branchSchema, "branchs");
