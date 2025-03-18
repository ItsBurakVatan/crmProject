import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

export default mongoose.model("Branch", branchSchema, "branchs"); // Koleksiyon adını açıkça belirt

