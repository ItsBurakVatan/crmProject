import mongoose from "mongoose";

const adayCariSchema = new mongoose.Schema({
    sube: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" , required: [true, "Şube zorunlu!"]},
    adayKodu: { 
        type: Number, 
    },
    chUnvani: { 
        type: String, 
        required: [true, "C/H Ünvanı zorunlu!"], 
        minlength: [3, "C/H Ünvanı en az 3 karakter olmalı!"]
    },
    adres: { type: String },
    ulke: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: [true, "Ülke zorunlu!"]},
    il: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: [true, "İl zorunlu!"]},
    ilce: { type: mongoose.Schema.Types.ObjectId, ref: "Town", required: [true, "İlçe zorunlu!"]},
    sorumluPersonel: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    yetkiliAdiSoyadi: { 
        type: String, 
        minlength: [2, "Yetkili adı soyadı en az 2 karakter olmalı!"]
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
        match: [/^\d{10}$/, "Vergi numarası 10 haneli olmalı!"]
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
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User"
    },
}, { timestamps: true });

export default mongoose.model("AdayCari", adayCariSchema, "adaycaris");
