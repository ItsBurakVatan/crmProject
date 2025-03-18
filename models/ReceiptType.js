import mongoose from "mongoose";

const receiptTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Fiş türü adı zorunlu"] 
    }
});

export default mongoose.model("ReceiptType", receiptTypeSchema, "receiptTypes");
