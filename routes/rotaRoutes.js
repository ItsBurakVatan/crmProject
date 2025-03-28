import express from "express";
import {
    getCariHesapList,
    addCariHesap,
    updateCariHesap,
    getCariHesapActions,
    syncRotaCloud,
} from "../services/rotaCloudService.js";
import { verifyToken, authorize } from "../middleware/auth.js"; // Middleware’ler eklendi
import AdayCari from "../models/AdayCari.js"; // CRM’e ekleme için model eklendi
import logger from "../utils/logger.js"; // Hata ayıklama için logger eklendi

const router = express.Router();

// Cari hesap listesi (herkes erişebilir, ancak token gerekli)
router.get("/cari-hesap/list", verifyToken, async (req, res) => {
    try {
        const { filter, code, limit, search, company_id, user_id, branch_id } = req.query;
        const list = await getCariHesapList({
            filter: filter || "ALL",
            code: code || "",
            limit: limit || "",
            search: search || "",
            company_id: company_id || req.user?.company,
            user_id: user_id || req.user?.id,
            branch_id: branch_id ? branch_id.split(",") : [],
        });
        res.json(list);
    } catch (error) {
        logger.error("Cari hesap listesi alınamadı:", error.message);
        res.status(500).json({
            error: "Liste alınamadı",
            message: error.message,
        });
    }
});

// Yeni cari hesap ekleme (Rotadan CRM’e senkronizasyon eklendi)
router.post("/cari-hesap/add", verifyToken, authorize("admin", "manager"), async (req, res) => {
    try {
        const cariData = {
            ...req.body,
            user_id: req.body.user_id || req.user?.id,
            firmaid: req.body.firmaid || req.user?.company,
        };
        const result = await addCariHesap(cariData);
        
        // CRM’e ekleme
        const exists = await AdayCari.findOne({ adayKodu: cariData.code });
        if (!exists) {
            const newCari = await AdayCari.create({
                chUnvani: cariData.account,
                adayKodu: cariData.code,
                synced: true,
                company: cariData.firmaid || req.user?.company,
            });
            logger.info("Rota Cloud’dan CRM’e cari eklendi:", { id: newCari._id, code: cariData.code });
        } else {
            logger.info("Cari zaten CRM’de mevcut:", { code: cariData.code });
        }

        res.status(201).json(result);
    } catch (error) {
        logger.error("Cari ekleme başarısız:", error.message);
        res.status(500).json({
            error: "Ekleme başarısız",
            message: error.message,
        });
    }
});
// Cari hesap güncelleme
router.put("/cari-hesap/update/:id", verifyToken, authorize("admin", "manager"), async (req, res) => {
    try {
        const { id } = req.params;
        const cariData = {
            ...req.body,
            user_id: req.body.user_id || req.user?.id,
            firmaid: req.body.firmaid || req.user?.company,
        };
        const result = await updateCariHesap(id, cariData);
        res.json(result);
    } catch (error) {
        logger.error("Cari güncelleme başarısız:", error.message);
        res.status(500).json({
            error: "Güncelleme başarısız",
            message: error.message,
        });
    }
});

// Cari hesap aksiyonları
router.get("/cari-hesap/actions", verifyToken, async (req, res) => {
    try {
        const { user_id, company_id, currency, fdate, edate, cid, code, types } = req.query;
        const actions = await getCariHesapActions({
            user_id: user_id || req.user?.id,
            company_id: company_id || req.user?.company,
            currency: currency || "TRY",
            fdate: fdate || "",
            edate: edate || "",
            cid: cid || "",
            code: code || "",
            types: types || "",
        });
        res.json(actions);
    } catch (error) {
        logger.error("Cari aksiyonlar alınamadı:", error.message);
        res.status(500).json({
            error: "Aksiyonlar alınamadı",
            message: error.message,
        });
    }
});

// Rota Cloud ile senkronizasyon
router.post("/sync", verifyToken, authorize("admin"), async (req, res) => {
    try {
        const { companyId, userId, branchId } = req.body;
        const result = await syncRotaCloud(
            companyId || req.user?.company,
            userId || req.user?.id,
            branchId || []
        );
        res.json(result);
    } catch (error) {
        logger.error("Senkronizasyon başarısız:", error.message);
        res.status(500).json({
            error: "Senkronizasyon başarısız",
            message: error.message,
        });
    }
});

export default router;
