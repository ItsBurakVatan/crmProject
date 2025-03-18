import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
    name: String,
});

export default mongoose.model("Status", statusSchema);