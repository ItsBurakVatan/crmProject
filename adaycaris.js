import express from "express";
import mongoose from "mongoose";
import { createAdayCari, getAdayCaris, updateAdayCari, deleteAdayCari } from "../controllers/adaycaris.js";
import Branch from "../models/Branch.js";
import City from "../models/cities.js";
import Country from "../models/countries.js";
import Group from "../models/Group.js";
import Staff from "../models/staff.js";
import Status from "../models/Status.js";
import Town from "../models/Town.js";
import { verifyRole } from "../middleware/jwtAuth.js";
import { authorize } from "../middleware/auth.js";


const router = express.Router();

// Aday Cari işlemleri
router.post("/", createAdayCari);

// Sabit rotalar (parametresiz) önce gelmeli
router.get("/branchs", async (req, res) => {
    try {
        const branchs = await Branch.find();
        console.log("Branchs:", branchs);
        res.status(200).json(branchs);
    } catch (err) {
        console.error("Branchs Error:", err);
        res.status(500).json(err);
    }
});

router.get("/countries", async (req, res) => {
    try {
        const countries = await Country.find();
        res.status(200).json(countries);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/cities/:countryId", async (req, res) => {
    try {
        const cities = await City.find({ country: req.params.countryId });
        res.status(200).json(cities);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/towns/:plate", async (req, res) => {
    try {
        const towns = await Town.find({ city: req.params.plate });
        console.log("Towns for plate", req.params.plate, ":", towns);
        res.status(200).json(towns);
    } catch (err) {
        console.error("Towns Error:", err);
        res.status(500).json(err);
    }
});

router.get("/groups", async (req, res) => {
    try {
        const groups = await Group.find();
        res.status(200).json(groups);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/staff", async (req, res) => {
    try {
        const staff = await Staff.find();
        console.log("Staff:", staff);
        res.status(200).json(staff);
    } catch (err) {
        console.error("Staff Error:", err);
        res.status(500).json(err);
    }
});

router.get("/status", async (req, res) => {
    try {
        const status = await Status.find();
        res.status(200).json(status);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/status-counts/:companyId", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.companyId)) {
            return res.status(400).json({ message: "Geçersiz companyId formatı" });
        }

        // Tüm durumları getir
        const statuses = await Status.find();
        if (!statuses || statuses.length === 0) {
            return res.status(404).json({ message: "Durumlar bulunamadı" });
        }
        console.log("Tüm durumlar:", statuses);

        // Durumları bir map'e çevir
        const statusMap = statuses.reduce((map, status) => {
            map[status._id.toString()] = status.name.toLowerCase().trim();
            return map;
        }, {});
        console.log("Status Map:", statusMap);

        // Aday carileri companyId'ye göre grupla
        const counts = await mongoose.connection.db.collection("adaycaris").aggregate([
            {
                $match: { company: new mongoose.Types.ObjectId(req.params.companyId) }
            },
            {
                $group: {
                    _id: "$durumu",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        console.log("Gruplanmış sayımlar:", counts);

        // Dinamik bir obje oluştur
        const statusCounts = statuses.reduce((obj, status) => {
            obj[status.name.toLowerCase().trim()] = 0; // Varsayılan 0
            return obj;
        }, {});

        counts.forEach(count => {
            const statusId = count._id?.toString();
            const statusName = statusMap[statusId];
            if (statusName) {
                statusCounts[statusName] = count.count;
            }
        });

        console.log("Son durum sayıları:", statusCounts);
        res.status(200).json(statusCounts);
    } catch (err) {
        console.error("Status counts error:", err);
        res.status(500).json({ message: "Durum sayıları alınırken hata oluştu", error: err.message });
    }
}); 

router.get("/search/:companyId", authorize("admin", "manager", "staff"), async (req, res, next) => {
    try {
        const query = req.query.query;
        const filter = {
            company: req.params.companyId,
            chUnvani: { $regex: query, $options: "i" } // Büyük/küçük harf duyarsız arama
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

const validateAdayCari = (req, res, next) => {
    const { adayKodu, chUnvani } = req.body;
    if (!adayKodu || !chUnvani) {
        return res.status(400).json({ message: "Aday kodu ve C/H ünvanı zorunlu!" });
    }
    next();
};

router.post("/", validateAdayCari, createAdayCari);

// Parametreli rotalar
router.get("/:companyId", authorize("admin", "manager", "staff"), getAdayCaris);
router.post("/", authorize("admin", "manager"), createAdayCari);
router.put("/:id", authorize("admin", "manager"), updateAdayCari);
router.delete("/:id", authorize("admin"), deleteAdayCari);
export default router;