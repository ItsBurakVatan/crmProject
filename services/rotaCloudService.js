import rotaCloud from "@api/rota-cloud";
import AdayCari from "../models/AdayCari.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

let currentToken = null;
let tokenExpiration = null;

export async function getRotaToken(username = process.env.ROTA_USERNAME, password = process.env.ROTA_PASSWORD) {
    try {
        const { data } = await rotaCloud.postLogin({ username, password });
        logger.info("Rota Cloud Login Data:", data);
        const token = data.token;
        rotaCloud.auth(token); // Token kütüphaneye set ediliyor
        return data;
    } catch (error) {
        logger.error("Rota Cloud Login Error Details:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw new Error(error.response?.data?.message || `Rota Cloud giriş başarısız: ${error.message}`);
    }
}

async function ensureToken() {
    const now = Date.now();
    if (!currentToken || !tokenExpiration || now >= tokenExpiration) {
        const loginData = await getRotaToken();
        currentToken = loginData.token;
        tokenExpiration = now + (loginData.expires_in * 1000 || 3600 * 1000); // Varsayılan 1 saat
        logger.info("Yeni token alındı:", currentToken);
    }
    return currentToken;
}

export async function initializeRotaCloud() {
    try {
        const loginData = await getRotaToken();
        currentToken = loginData.token;
        tokenExpiration = Date.now() + (loginData.expires_in * 1000 || 3600 * 1000);
        logger.info("Rota Cloud yetkilendirme ayarlandı:", currentToken);
    } catch (err) {
        logger.error("Rota Cloud yetkilendirme başarısız:", err.message);
    }
}

export async function getCariHesapList({ filter = "ALL", code = "", limit = "", search = "", company_id, user_id, branch_id = [] }) {
    try {
        await ensureToken();
        const params = { filter, code, limit, search, company_id: "2", user_id, branch_id: branch_id.join(",") };
        logger.info("getCariHesapList Params:", params);
        const { data } = await rotaCloud.getChkList(params);
        logger.info("Rota Cloud’dan Gelen Veriler:", data);
        return data;
    } catch (error) {
        logger.error("getCariHesapList Error Details:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw new Error(error.response?.data?.message || "Rota Cloud’dan cari listesi alınamadı.");
    }
}

export const addCariHesap = async (data) => {
    try {
        await ensureToken(); // Token’ın güncel olduğundan emin ol
        logger.info("addCariHesap çağrıldı, veri:", data);
        logger.info("Kullanılan token:", currentToken); // Token’ı logla
        const { data: response } = await rotaCloud.postChkAdd(data); // rotaCloudAPI yerine rotaCloud
        logger.info("Rota Cloud’dan ekleme yanıtı:", response);
        return response;
    } catch (err) {
        logger.error("addCariHesap hatası:", {
            requestData: data,
            status: err.response?.status,
            responseData: err.response?.data,
            message: err.message,
            stack: err.stack,
        });
        throw new Error("Rota Cloud’a cari eklenemedi: " + (err.response?.data?.message || err.message || "Bilinmeyen hata"));
    }
};

export async function updateCariHesap(cariId, cariData) {
    try {
        await ensureToken();
        const { data } = await rotaCloud.putChkUpdate({ id: cariId, ...cariData });
        logger.info("Rota Cloud’dan güncelleme yanıtı:", data);
        return data;
    } catch (error) {
        logger.error("updateCariHesap hatası:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw new Error(error.response?.data?.message || "Rota Cloud’da cari güncellenemedi.");
    }
}

export async function getCariHesapActions({ user_id, company_id, currency = "TRY", fdate = "", edate = "", cid = "", code = "", types = "" }) {
    try {
        await ensureToken();
        const params = { user_id, company_id, currency, fdate, edate, cid, code, types };
        logger.info("getCariHesapActions Params:", params);
        const { data } = await rotaCloud.getChkList(params);
        logger.info("Rota Cloud’dan aksiyon yanıtı:", data);
        return data;
    } catch (error) {
        logger.error("getCariHesapActions hatası:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw new Error(error.response?.data?.message || "Rota Cloud’dan cari aksiyonları alınamadı.");
    }
}

export async function syncRotaCloud(companyId, userId, branchId = []) {
    try {
        await ensureToken();
        logger.info("Rota Cloud Senkronizasyonu Başladı:", { companyId, userId, branchId });

        // Rota Cloud’dan verileri çek
        const rotaCaris = await getCariHesapList({
            filter: "ALL",
            company_id: companyId,
            user_id: userId,
            branch_id: branchId,
        });

        if (!rotaCaris || !Array.isArray(rotaCaris.result)) {
            throw new Error("Rota Cloud’dan geçersiz veri formatı alındı.");
        }

        const cariList = rotaCaris.result;
        logger.info("Rota Cloud’dan alınan cari sayısı:", cariList.length);

        // Rotadan CRM’e senkronizasyon
        for (const rotaCari of cariList) {
            const exists = await AdayCari.findOne({ adayKodu: rotaCari.code });
            if (!exists) {
                await AdayCari.create({
                    chUnvani: rotaCari.account,
                    adayKodu: rotaCari.code,
                    synced: true,
                    company: companyId,
                });
                logger.info("Rota Cloud’dan CRM’e yeni cari eklendi:", rotaCari.code);
            }
        }

        // CRM’den Rotaya senkronizasyon
        const localCaris = await AdayCari.find({ company: companyId, synced: false });
        logger.info("Senkronize edilecek yerel cari sayısı:", localCaris.length);

        for (const localCari of localCaris) {
            const cariData = {
                user_id: userId || "9", // Kullanıcı ID’si yoksa varsayılan
                account: localCari.chUnvani,
                code: localCari.adayKodu?.toString(),
                phone: localCari.yetkiliTelefon || "",
                email: localCari.yetkiliEmail || "",
                address: localCari.adres || "",
                city: localCari.il || "",
                state: localCari.ilce || "",
                country: localCari.ulke || "",
                vdairesi: localCari.vergiDairesi || "",
                vkn: localCari.vergiNo || "",
                tckn: localCari.tcKimlikNo || "",
                notes: localCari.aciklama || "",
                firmaid: "2", // Sabit değer
                subeid: ["1"],
                yetkililer: localCari.yetkiliAdiSoyadi ? [{
                    name: localCari.yetkiliAdiSoyadi,
                    title: localCari.yetkiliGorevi || "",
                }] : [],
            };

            const existingRotaCari = cariList.find((c) => c.code === localCari.adayKodu);
            if (existingRotaCari) {
                await updateCariHesap(existingRotaCari.id, cariData);
                logger.info("Rota Cloud’da cari güncellendi:", localCari.adayKodu);
            } else {
                await addCariHesap(cariData);
                logger.info("Rota Cloud’a yeni cari eklendi:", localCari.adayKodu);
            }

            await AdayCari.updateOne({ _id: localCari._id }, { $set: { synced: true } });
            logger.info("Yerel cari synced olarak işaretlendi:", localCari.adayKodu);
        }

        logger.info("Rota Cloud ile senkronizasyon tamamlandı");
        return { success: true, message: "Senkronizasyon tamamlandı" };
    } catch (err) {
        logger.error("Rota Cloud Senkronizasyon Hatası:", {
            message: err.message,
            stack: err.stack,
        });
        throw err;
    }
}

initializeRotaCloud();
