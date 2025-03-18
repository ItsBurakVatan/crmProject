import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
    name: { type: String, required: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
    plate: { type: String, required: true }, // Plaka numarası
});

export default mongoose.model("City", citySchema, "cities");
