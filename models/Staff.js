import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Personel adı zorunlu!"], 
        minlength: [2, "Personel adı en az 2 karakter olmalı!"]
    },
});

export default mongoose.model("Staff", staffSchema, "staff");
