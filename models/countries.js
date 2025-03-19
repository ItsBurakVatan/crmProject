import mongoose from "mongoose";

const countrySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Ülke adı zorunlu!"], 
        minlength: [2, "Ülke adı en az 2 karakter olmalı!"]
    },
});

export default mongoose.model("Country", countrySchema, "countries");
