import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        email: { type: String, required: true },
        role: { 
            type: String, 
            enum: ["admin", "manager", "staff"], 
            default: "staff" 
        } // Roller: admin, yönetici, personel
    },
    { timestamps: true }
);

export default mongoose.model("User", UserSchema, "users");
