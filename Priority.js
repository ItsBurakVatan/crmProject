import mongoose from "mongoose";

const prioritySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Öncelik adı zorunlu"] 
    }
});

export default mongoose.model("Priority", prioritySchema, "priorities");