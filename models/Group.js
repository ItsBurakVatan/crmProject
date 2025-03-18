import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: String,
});

export default mongoose.model("Group", groupSchema);
