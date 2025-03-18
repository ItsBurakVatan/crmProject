import mongoose from "mongoose";
import AdayCari from "../models/AdayCari.js";

export const createAdayCari = async (req, res, next) => {
    try {
        const existingAday = await AdayCari.findOne({ adayKodu: req.body.adayKodu });
        if (existingAday) {
            return next(createError(400, "Bu aday kodu zaten kullanılıyor!"));
        }
        const newAdayCari = new AdayCari(req.body);
        const savedAdayCari = await newAdayCari.save();
        res.status(201).json(savedAdayCari);
    } catch (err) {
        if (err.name === "ValidationError") {
            return next(createError(400, "Geçersiz veri: " + err.message));
        }
        next(createError(500, "Aday cari oluşturulamadı: " + err.message));
    }
};

export const getAdayCaris = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { company: req.params.companyId };
        if (req.user.role === "staff") {
            filter.sorumluPersonel = req.user.id;
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
        next(err);
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
        next(createError(500, "Aday cari güncellenemedi: " + err.message));
    }
};

export const deleteAdayCari = async (req, res, next) => {
    try {
        const deletedAdayCari = await AdayCari.findByIdAndDelete(req.params.id);
        if (!deletedAdayCari) {
            return res.status(404).json({ message: "Aday cari bulunamadı" });
        }
        res.status(200).json({ message: "Aday cari silindi" });
    } catch (err) {
        next(err);
    }
};
