import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Şehir adı zorunlu!"], 
        minlength: [2, "Şehir adı en az 2 karakter olmalı!"]
    },
    country: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Country", 
        required: [true, "Ülke bilgisi zorunlu!"]
    },
    plate: { 
        type: String, 
        required: [true, "Plaka numarası zorunlu!"], 
        minlength: [1, "Plaka numarası en az 1 karakter olmalı!"]
    },
});

export default mongoose.model("City", citySchema, "cities");
