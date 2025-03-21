import mongoose from "mongoose";
import AdayCari from "../models/AdayCari.js";
import { createError } from "../error.js";

export const createAdayCari = async (req, res, next) => {
    try {
        const lastAday = await AdayCari.findOne({}, {}, { sort: { adayKodu: -1 } });
        const newAdayKodu = lastAday ? lastAday.adayKodu + 1 : 1;

        console.log("Gelen veri:", req.body); // Gelen veriyi logla

        const newAdayCari = new AdayCari({
            ...req.body,
            adayKodu: newAdayKodu,
        });
        const savedAdayCari = await newAdayCari.save();
        console.log("Kaydedilen veri:", savedAdayCari); // Başarılı kaydı logla
        res.status(201).json(savedAdayCari);
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.keys(err.errors).map(key => ({
                field: key,
                message: err.errors[key].message
            }));
            console.log("Doğrulama hatası:", errors); // Hata detaylarını logla
            return next(createError(400, "Geçersiz veri!", { details: errors }));
        }
        console.error("Genel hata:", err); // Diğer hataları logla
        next(createError(500, "Aday cari oluşturulamadı!", { error: err.message }));
    }
};

export const getAdayCaris = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { company: req.params.companyId };
        if (req.user.role === "staff") {
            // Staff sadece kendi eklediği aday carileri görsün
            filter.company = req.user.id; // company alanını kullanıcı ID'si ile filtrele
        }

        const total = await AdayCari.countDocuments(filter);
        const adayCaris = await AdayCari.find(filter)
            .populate("ulke")
            .populate("il")
            .populate("ilce")
            .populate("sube")
            .populate("sorumluPersonel")
            .populate("durumu")
            .populate("cariHesapGrubu")
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            data: adayCaris,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        next(createError(500, "Aday cariler alınamadı!", { error: err.message }));
    }
};

export const updateAdayCari = async (req, res, next) => {
    try {
        const updatedAdayCari = await AdayCari.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate("ulke").populate("il").populate("ilce").populate("sube")
         .populate("sorumluPersonel").populate("durumu").populate("cariHesapGrubu");
        if (!updatedAdayCari) {
            return next(createError(404, "Güncellenecek aday cari bulunamadı!"));
        }
        res.status(200).json(updatedAdayCari);
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.keys(err.errors).map(key => ({
                field: key,
                message: err.errors[key].message
            }));
            return next(createError(400, "Geçersiz veri girişi!", errors));
        }
        if (err.code === 11000) {
            return next(createError(400, "Bu aday kodu zaten mevcut!"));
        }
        next(createError(500, "Aday cari güncellenemedi!", { error: err.message }));
    }
};

export const deleteAdayCari = async (req, res, next) => {
    try {
        const deletedAdayCari = await AdayCari.findByIdAndDelete(req.params.id);
        if (!deletedAdayCari) {
            return next(createError(404, "Silinecek aday cari bulunamadı!"));
        }
        res.status(200).json({ message: "Aday cari başarıyla silindi" });
    } catch (err) {
        next(createError(500, "Aday cari silinemedi!", { error: err.message }));
    }
};
