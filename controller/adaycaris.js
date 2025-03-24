import mongoose from "mongoose";
import AdayCari from "../models/AdayCari.js";
import { createError } from "../error.js";

export const createAdayCari = async (req, res, next) => {
    try {
        const lastAday = await AdayCari.findOne({}, {}, { sort: { adayKodu: -1 } });
        const newAdayKodu = lastAday ? lastAday.adayKodu + 1 : 1;

        console.log("Gelen veri:", req.body);

        const newAdayCari = new AdayCari({
            ...req.body,
            adayKodu: newAdayKodu,
        });
        const savedAdayCari = await newAdayCari.save();
        console.log("Kaydedilen veri:", savedAdayCari);
        res.status(201).json(savedAdayCari);
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.keys(err.errors).map(key => ({
                field: key,
                message: err.errors[key].message
            }));
            console.log("Doğrulama hatası:", errors);
            return next(createError(400, "Geçersiz veri!", { details: errors }));
        }
        console.error("Genel hata:", err);
        next(createError(500, "Aday cari oluşturulamadı!", { error: err.message }));
    }
};

export const getAdayCaris = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let filter = {};
        let total;

        // Eğer companyId varsa (staff veya belirli bir kullanıcı için)
        if (req.params.companyId) {
            filter.company = req.params.companyId;
            if (req.user.role === "staff") {
                // Staff sadece kendi eklediği aday carileri görsün
                filter.company = req.user.id;
            }
            total = await AdayCari.countDocuments(filter);
        } else {
            // companyId yoksa (admin için tüm cariler)
            total = await AdayCari.countDocuments();
        }

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

        console.log("Getirilen Aday Cariler:", adayCaris); // Dönen veriyi logla

        res.status(200).json({
            data: adayCaris,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error("Hata:", err.message);
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
