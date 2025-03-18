import mongoose from "mongoose";

const adayCariSchema = new mongoose.Schema({
    sube: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    adayKodu: { 
        type: Number, 
        required: [true, "Aday kodu zorunlu!"], 
        unique: true 
    },
    chUnvani: { type: String, required: [true, "C/H Ünvanı zorunlu!"] },
    adres: { type: String },
    ulke: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
    il: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
    ilce: { type: mongoose.Schema.Types.ObjectId, ref: "Town" },
    sorumluPersonel: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    yetkiliAdiSoyadi: { type: String },
    yetkiliGorevi: { type: String },
    yetkiliEmail: { 
        type: String,
        match: [/^\S+@\S+\.\S+$/, "Geçerli bir email adresi girin!"]
    },
    yetkiliTelefon: { type: String },
    vergiDairesi: { type: String },
    vergiNo: { type: String, match: [/^\d{10}$/, "Vergi numarası 10 haneli olmalı!"] },
    tcKimlikNo: { type: String, match: [/^\d{11}$/, "TC Kimlik No 11 haneli olmalı!"] },
    aciklama: { type: String },
    durumu: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
    cariHesapGrubu: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    musteriHikayesi: { type: String },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("AdayCari", adayCariSchema, "adaycaris");
