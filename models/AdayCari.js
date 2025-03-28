import mongoose from "mongoose";

const adayCariSchema = new mongoose.Schema({
    sube: { type: String }, // Şube ID’sini string olarak sakla
    adayKodu: { type: Number },
    chUnvani: { 
        type: String, 
        required: [true, "C/H Ünvanı zorunlu!"], 
        minlength: [3, "C/H Ünvanı en az 3 karakter olmalı!"]
    },
    adres: { type: String },
    ulke: { type: String }, // Ülke string olarak saklanacak
    il: { type: String }, // İl string olarak saklanacak
    ilce: { type: String }, // İlçe string olarak saklanacak
    sorumluPersonel: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    yetkiliAdiSoyadi: { 
        type: String
    },
    yetkiliGorevi: { type: String },
    yetkiliEmail: { 
        type: String,
        match: [/^\S+@\S+\.\S+$/, "Geçerli bir email adresi girin!"]
    },
    yetkiliTelefon: { type: String },
    vergiDairesi: { type: String },
    vergiNo: { 
        type: String, 
        match: [/^\d{8,15}$/, "Vergi numarası 8-15 haneli olmalı!"]
    },
    tcKimlikNo: { 
        type: String, 
        match: [/^\d{11}$/, "TC Kimlik No 11 haneli olmalı!"]
    },
    aciklama: { type: String },
    durumu: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
    cariHesapGrubu: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    musteriHikayesi: { type: String },
    company: { 
        type: String,
        required: [true, "Şirket ID zorunlu!"]
    },
    synced: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("AdayCari", adayCariSchema, "adaycaris");
