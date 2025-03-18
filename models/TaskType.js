import mongoose from "mongoose";

const taskTypeSchema = new mongoose.Schema({
    name: String,
});

export default mongoose.model("TaskType", taskTypeSchema, "taskTypes");
