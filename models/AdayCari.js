import mongoose from "mongoose";

const adayCariSchema = new mongoose.Schema({
    sube: { type: String, default: "" },
    adayKodu: { 
        type: Number,
        required: [true, "Aday Kodu zorunlu!"],
        unique: true
    },
    chUnvani: { 
        type: String, 
        required: [true, "C/H Ünvanı zorunlu!"], 
        default: "Bilinmeyen Hesap"
    },
    adres: { type: String, default: "" },
    ulke: { type: String, default: "Türkiye" },
    il: { type: String, default: "" },
    ilce: { type: String, default: "" },
    sorumluPersonel: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    yetkiliAdiSoyadi: { type: String, default: "" },
    yetkiliGorevi: { type: String, default: "" },
    yetkiliEmail: { 
        type: String,
        default: ""
    },
    yetkiliTelefon: { type: String, default: "" },
    vergiDairesi: { type: String, default: "" },
    vergiNo: { 
        type: String, 
        default: ""
    },
    tcKimlikNo: { 
        type: String, 
        default: ""
    },
    aciklama: { type: String, default: "" },
    durumu: { type: mongoose.Schema.Types.ObjectId, ref: "Status", default: null },
    cariHesapGrubu: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    musteriHikayesi: { type: String, default: "" },
    city: { type: String, default: "" },
    zip: { type: String, default: "" },
    company: { 
        type: String,
        required: [true, "Şirket ID zorunlu!"],
        default: "2"
    },
    synced: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("AdayCari", adayCariSchema, "adaycaris");
