import mongoose from "mongoose";

const townSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true }, // İl’in plaka numarası
});

export default mongoose.model("Town", townSchema, "towns");