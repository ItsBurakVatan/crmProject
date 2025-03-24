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

const router = express.Router();

const validateAdayCari = (req, res, next) => {
    const { adayKodu, chUnvani } = req.body;
    if (!adayKodu || !chUnvani) {
        return res.status(400).json({ message: "Aday kodu ve C/H ünvanı zorunlu!" });
    }
    next();
};

// Tüm aday carileri listele (admin için)
router.get("/", authorize("admin"), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        console.log("Fetching all aday caris:", { page, limit }); // Log ekle
        const total = await AdayCari.countDocuments();
        const adayCaris = await AdayCari.find()
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("sube durumu ulke il ilce sorumluPersonel cariHesapGrubu");
        console.log("Filtrelenmiş Aday Cariler:", adayCaris); // Dönen veriyi logla
        res.status(200).json({ 
            data: adayCaris, 
            total, 
            page: parseInt(page), 
            pages: Math.ceil(total / limit) 
        });
    } catch (err) {
        console.error("Hata:", err.message);
        res.status(500).json({ message: "Aday cariler alınamadı!", error: err.message });
    }
});

// Sabit rotalar
router.get("/branchs", async (req, res) => {
    try {
        const branchs = await Branch.find();
        res.status(200).json(branchs);
    } catch (err) {
        res.status(500).json({ message: "Şubeler alınamadı", error: err.message });
    }
});

router.get("/countries", async (req, res) => {
    try {
        const countries = await Country.find();
        res.status(200).json(countries);
    } catch (err) {
        res.status(500).json({ message: "Ülkeler alınamadı", error: err.message });
    }
});

router.get("/cities/:countryId", async (req, res) => {
    try {
        const cities = await City.find({ country: req.params.countryId });
        res.status(200).json(cities);
    } catch (err) {
        res.status(500).json({ message: "Şehirler alınamadı", error: err.message });
    }
});

router.get("/towns/:plate", async (req, res) => {
    try {
        const towns = await Town.find({ city: req.params.plate });
        res.status(200).json(towns);
    } catch (err) {
        res.status(500).json({ message: "İlçeler alınamadı", error: err.message });
    }
});

router.get("/groups", async (req, res) => {
    try {
        const groups = await Group.find();
        res.status(200).json(groups);
    } catch (err) {
        res.status(500).json({ message: "Gruplar alınamadı", error: err.message });
    }
});

router.get("/staff", async (req, res) => {
    try {
        const staff = await Staff.find();
        res.status(200).json(staff);
    } catch (err) {
        res.status(500).json({ message: "Personel alınamadı", error: err.message });
    }
});

router.get("/status", async (req, res) => {
    try {
        const status = await Status.find();
        res.status(200).json(status);
    } catch (err) {
        res.status(500).json({ message: "Durumlar alınamadı", error: err.message });
    }
});

router.get("/status-counts/:companyId", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.companyId)) {
            return res.status(400).json({ message: "Geçersiz companyId formatı" });
        }

        const statuses = await Status.find();
        if (!statuses || statuses.length === 0) {
            return res.status(404).json({ message: "Durumlar bulunamadı" });
        }

        const statusMap = statuses.reduce((map, status) => {
            map[status._id.toString()] = status.name.toLowerCase().trim();
            return map;
        }, {});

        const counts = await AdayCari.aggregate([
            { $match: { company: new mongoose.Types.ObjectId(req.params.companyId) } },
            { $group: { _id: "$durumu", count: { $sum: 1 } } }
        ]);

        const statusCounts = statuses.reduce((obj, status) => {
            obj[status.name.toLowerCase().trim()] = 0;
            return obj;
        }, {});

        counts.forEach(count => {
            const statusId = count._id?.toString();
            const statusName = statusMap[statusId];
            if (statusName) {
                statusCounts[statusName] = count.count;
            }
        });

        res.status(200).json(statusCounts);
    } catch (err) {
        res.status(500).json({ message: "Durum sayıları alınırken hata oluştu", error: err.message });
    }
});

router.get("/search/:companyId", authorize("admin", "manager", "staff"), async (req, res, next) => {
    try {
        const query = req.query.query;
        const filter = {
            company: req.params.companyId,
            chUnvani: { $regex: query, $options: "i" }
        };
        if (req.user.role === "staff") {
            filter.sorumluPersonel = req.user.id;
        }
        const adayCaris = await AdayCari.find(filter)
            .populate("ulke")
            .populate("il")
            .populate("ilce")
            .populate("sube")
            .populate("sorumluPersonel")
            .populate("durumu")
            .populate("cariHesapGrubu");
        res.status(200).json(adayCaris);
    } catch (err) {
        next(err);
    }
});

router.get("/:companyId/status-report", verifyToken, async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.companyId)) {
            return res.status(400).json({ message: "Geçersiz companyId" });
        }

        const statuses = await Status.find({
            name: { $in: ["Potansiyel", "Keşif Bekleyen", "Olumsuz"] }
        });
        if (!statuses || statuses.length === 0) {
            return res.status(404).json({ message: "Durumlar bulunamadı" });
        }

        const statusMap = statuses.reduce((map, status) => {
            map[status.name] = status._id;
            return map;
        }, {});

        const caris = await AdayCari.find({ company: req.params.companyId }).populate("durumu");
        if (!caris || caris.length === 0) {
            return res.status(200).json({
                potential: 0,
                discoveryPending: 0,
                negative: 0,
                message: "Aday cari bulunamadı"
            });
        }

        console.log("AdayCaris:", caris);

        const potential = caris.filter(cari => 
            cari.durumu && cari.durumu._id.toString() === statusMap["Potansiyel"].toString()
        ).length;
        const discoveryPending = caris.filter(cari => 
            cari.durumu && cari.durumu._id.toString() === statusMap["Keşif Bekleyen"].toString()
        ).length;
        const negative = caris.filter(cari => 
            cari.durumu && cari.durumu._id.toString() === statusMap["Olumsuz"].toString()
        ).length;

        res.status(200).json({ potential, discoveryPending, negative });
    } catch (err) {
        console.error("Status report error:", err);
        res.status(500).json({ message: "Müşteri durum özeti alınamadı", error: err.message });
    }
});

// Parametreli rotalar
router.get("/:companyId", authorize("admin", "manager", "staff"), getAdayCaris);
router.post("/", authorize("admin", "manager", "staff"), validateAdayCari, createAdayCari);
router.put("/:id", authorize("admin", "manager"), updateAdayCari);
router.delete("/:id", authorize("admin"), deleteAdayCari);

export default router;
