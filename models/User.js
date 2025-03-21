import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username: { 
            type: String, 
            required: [true, "Kullanıcı adı zorunlu!"], 
            unique: [true, "Bu kullanıcı adı zaten kullanılıyor!"], 
            minlength: [3, "Kullanıcı adı en az 3 karakter olmalı!"]
        },
        password: { 
            type: String, 
            required: [true, "Şifre zorunlu!"], 
            minlength: [6, "Şifre en az 6 karakter olmalı!"]
        },
        email: { 
            type: String, 
            required: [true, "Email zorunlu!"], 
            match: [/^\S+@\S+\.\S+$/, "Geçerli bir email adresi girin!"]
        },
        role: { 
            type: String, 
            enum: ["admin", "manager", "staff"], 
            default: "staff" 
        },
        isActive: { 
            type: Boolean, 
            default: true }
    },
    { timestamps: true }
);

export default mongoose.model("User", UserSchema, "users");
