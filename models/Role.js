import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Rol adı zorunlu!"],
        unique: true,
        trim: true,
    }
}, { timestamps: true });

export default mongoose.model("Role", roleSchema, "roles");