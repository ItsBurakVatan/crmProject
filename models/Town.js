import mongoose from "mongoose";

const townSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "İlçe adı zorunlu!"], 
        minlength: [2, "İlçe adı en az 2 karakter olmalı!"]
    },
    city: { 
        type: String, 
        required: [true, "Şehir bilgisi zorunlu!"]
    },
});

export default mongoose.model("Town", townSchema, "towns");
