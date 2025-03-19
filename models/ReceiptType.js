import mongoose from "mongoose";

const receiptTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Fiş türü adı zorunlu!"], 
        minlength: [2, "Fiş türü adı en az 2 karakter olmalı!"]
    }
});

export default mongoose.model("ReceiptType", receiptTypeSchema, "receiptTypes");
