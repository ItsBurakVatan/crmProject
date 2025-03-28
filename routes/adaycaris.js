import express from "express";
import mongoose from "mongoose";
import { createAdayCari, getAdayCaris, updateAdayCari, deleteAdayCari } from "../controllers/adaycaris.js";
import AdayCari from "../models/AdayCari.js";
import Branch from "../models/Branch.js";
import City from "../models/cities.js";
import Country from "../models/countries.js";
import Group from "../models/Group.js";
import Staff from "../models/Staff.js";
import Status from "../models/status.js";
import Town from "../models/Town.js";
import { authorize, verifyToken } from "../middleware/auth.js";
import { ApiError } from "../error.js"; // Doğru yol: utils/error.js
import { addCariHesap } from "../services/rotaCloudService.js";
import logger from "../utils/logger.js"; // Logger eklendi

const router = express.Router();

// Aday cari doğrulama middleware'i
const validateAdayCari = (req, res, next) => {
    const { adayKodu, chUnvani } = req.body;
    try {
        if (!adayKodu || !chUnvani) {
            throw ApiError.badRequest("Aday kodu ve C/H ünvanı zorunlu!");
        }
        next();
    } catch (error) {
        next(error); // Hata middleware’e yönlendiriliyor
    }
};

// Tüm aday carileri listele (sadece admin)
router.get("/", verifyToken, authorize("admin"), async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        logger.info("Fetching all aday caris:", { page, limit });
        const total = await AdayCari.countDocuments();
        const adayCaris = await AdayCari.find()
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        logger.info("Filtrelenmiş Aday Cariler:", adayCaris.length);
        res.status(200).json({
            data: adayCaris,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        logger.error("Aday cariler alınamadı:", err.message);
        next(ApiError.internal("Aday cariler alınamadı!", { error: err.message }));
    }
});

// Şubeleri listele
router.get("/branchs", async (req, res, next) => {
    try {
        const branchs = await Branch.find();
        res.status(200).json(branchs);
    } catch (err) {
        logger.error("Şubeler alınamadı:", err.message);
        next(ApiError.internal("Şubeler alınamadı", { error: err.message }));
    }
});

// Ülkeleri listele
router.get("/countries", async (req, res, next) => {
    try {
        const countries = await Country.find();
        res.status(200).json(countries);
    } catch (err) {
        logger.error("Ülkeler alınamadı:", err.message);
        next(ApiError.internal("Ülkeler alınamadı", { error: err.message }));
    }
});

// Şehirleri listele
router.get("/cities/:countryId", async (req, res, next) => {
    try {
        const cities = await City.find({ country: req.params.countryId });
        res.status(200).json(cities);
    } catch (err) {
        logger.error("Şehirler alınamadı:", err.message);
        next(ApiError.internal("Şehirler alınamadı", { error: err.message }));
    }
});

// İlçeleri listele
router.get("/towns/:plate", async (req, res, next) => {
    try {
        const plate = req.params.plate;
        logger.info("Fetching towns for plate:", plate);

        let query;
        if (mongoose.Types.ObjectId.isValid(plate)) {
            query = { city: mongoose.Types.ObjectId(plate) };
        } else {
            query = { city: plate };
        }

        const towns = await Town.find(query);
        logger.info("Found towns:", towns.length);
        res.status(200).json(towns.length ? towns : []);
    } catch (err) {
        logger.error("İlçeler alınamadı:", err.message);
        next(ApiError.internal("İlçeler alınamadı", { error: err.message }));
    }
});

// Grupları listele
router.get("/groups", async (req, res, next) => {
    try {
        const groups = await Group.find();
        res.status(200).json(groups);
    } catch (err) {
        logger.error("Gruplar alınamadı:", err.message);
        next(ApiError.internal("Gruplar alınamadı", { error: err.message }));
    }
});

// Personeli listele
router.get("/staff", async (req, res, next) => {
    try {
        const staff = await Staff.find();
        res.status(200).json(staff);
    } catch (err) {
        logger.error("Personel alınamadı:", err.message);
        next(ApiError.internal("Personel alınamadı", { error: err.message }));
    }
});

// Durumları listele
router.get("/status", async (req, res, next) => {
    try {
        const status = await Status.find();
        res.status(200).json(status);
    } catch (err) {
        logger.error("Durumlar alınamadı:", err.message);
        next(ApiError.internal("Durumlar alınamadı", { error: err.message }));
    }
});

// Durum sayıları
router.get("/status-counts/:companyId", async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.companyId)) {
            throw ApiError.badRequest("Geçersiz companyId formatı");
        }

        const statuses = await Status.find();
        if (!statuses || statuses.length === 0) {
            throw ApiError.notFound("Durumlar bulunamadı");
        }

        const statusMap = statuses.reduce((map, status) => {
            map[status._id.toString()] = status.name.toLowerCase().trim();
            return map;
        }, {});

        const counts = await AdayCari.aggregate([
            { $match: { company: req.params.companyId } },
            { $group: { _id: "$durumu", count: { $sum: 1 } } },
        ]);

        const statusCounts = statuses.reduce((obj, status) => {
            obj[status.name.toLowerCase().trim()] = 0;
            return obj;
        }, {});

        counts.forEach((count) => {
            const statusId = count._id?.toString();
            const statusName = statusMap[statusId];
            if (statusName) {
                statusCounts[statusName] = count.count;
            }
        });

        res.status(200).json(statusCounts);
    } catch (err) {
        logger.error("Durum sayıları alınırken hata oluştu:", err.message);
        next(err instanceof ApiError ? err : ApiError.internal("Durum sayıları alınırken hata oluştu", { error: err.message }));
    }
});

// Aday cari arama
router.get("/search/:companyId", verifyToken, authorize("admin", "manager", "staff"), async (req, res, next) => {
    try {
        const query = req.query.query;
        const filter = {
            company: req.params.companyId,
            chUnvani: { $regex: query, $options: "i" },
        };
        if (req.user.role === "staff") {
            filter.sorumluPersonel = req.user.id;
        }
        const adayCaris = await AdayCari.find(filter);
        res.status(200).json(adayCaris);
    } catch (err) {
        logger.error("Arama sırasında hata oluştu:", err.message);
        next(ApiError.internal("Arama sırasında hata oluştu", { error: err.message }));
    }
});

// Durum raporu
router.get("/:companyId/status-report", verifyToken, async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.companyId)) {
            throw ApiError.badRequest("Geçersiz companyId");
        }

        const statuses = await Status.find({
            name: { $in: ["Potansiyel", "Keşif Bekleyen", "Olumsuz"] },
        });
        if (!statuses || statuses.length === 0) {
            throw ApiError.notFound("Durumlar bulunamadı");
        }

        const statusMap = statuses.reduce((map, status) => {
            map[status.name] = status._id;
            return map;
        }, {});

        const caris = await AdayCari.find({ company: req.params.companyId });
        if (!caris || caris.length === 0) {
            return res.status(200).json({
                potential: 0,
                discoveryPending: 0,
                negative: 0,
                message: "Aday cari bulunamadı",
            });
        }

        const potential = caris.filter((cari) =>
            cari.durumu && cari.durumu._id.toString() === statusMap["Potansiyel"].toString()
        ).length;
        const discoveryPending = caris.filter((cari) =>
            cari.durumu && cari.durumu._id.toString() === statusMap["Keşif Bekleyen"].toString()
        ).length;
        const negative = caris.filter((cari) =>
            cari.durumu && cari.durumu._id.toString() === statusMap["Olumsuz"].toString()
        ).length;

        res.status(200).json({ potential, discoveryPending, negative });
    } catch (err) {
        logger.error("Müşteri durum özeti alınamadı:", err.message);
        next(err instanceof ApiError ? err : ApiError.internal("Müşteri durum özeti alınamadı", { error: err.message }));
    }
});

// Yeni aday cari ekle (Rota Cloud ile senkronizasyon eklendi)
router.post("/", verifyToken, authorize("admin", "manager", "staff"), validateAdayCari, async (req, res, next) => {
    try {
        const adayCari = await AdayCari.create(req.body);
        try {
            await addCariHesap({
                account: adayCari.chUnvani,
                code: adayCari.adayKodu.toString(),
                user_id: req.user.id,
                firmaid: "2",
            });
            adayCari.synced = true;
            await adayCari.save();
            logger.info("CRM’den Rota Cloud’a cari eklendi:", { id: adayCari._id });
            res.status(201).json(adayCari);
        } catch (syncErr) {
            logger.error("Rota Cloud sync hatası:", syncErr.message);
            // Hata olsa bile yerel kayıt devam eder, istemciye bilgi ver
            res.status(201).json({
                message: "Aday cari yerel olarak oluşturuldu, ancak Rota Cloud’a eklenemedi.",
                data: adayCari,
                syncError: syncErr.message,
            });
        }
    } catch (err) {
        logger.error("Aday cari oluşturulamadı:", err.message);
        next(ApiError.internal("Aday cari oluşturulamadı", { error: err.message }));
    }
});

// Kontrolörlerle tanımlı diğer rotalar
router.get("/:companyId", verifyToken, authorize("admin", "manager", "staff"), getAdayCaris);
router.put("/:id", verifyToken, authorize("admin", "manager"), updateAdayCari);
router.delete("/:id", verifyToken, authorize("admin"), deleteAdayCari);

export default router;
