import rotaCloud from "@api/rota-cloud";
import AdayCari from "../models/AdayCari.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

let currentToken = null;
let tokenExpiration = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function getRotaToken(username = process.env.ROTA_USERNAME, password = process.env.ROTA_PASSWORD) {
    try {
        if (!username || !password) {
            throw new Error("Rota Cloud kullanıcı adı veya şifre eksik!");
        }

        logger.info("Rota Cloud’a giriş yapılıyor:", { username });

        const { data } = await rotaCloud.postLogin({ username, password });
        logger.info("Rota Cloud Login Data:", data);

        if (!data.token) {
            throw new Error("Rota Cloud’dan token alınamadı!");
        }

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

async function ensureToken(forceRefresh = false) {
    const now = Date.now();
    logger.info("ensureToken çağrıldı:", { currentToken, tokenExpiration, now });

    if (forceRefresh || !currentToken || !tokenExpiration || now >= tokenExpiration - 60000) {
        try {
            const loginData = await getRotaToken();
            if (!loginData.token) {
                throw new Error("Rota Cloud’dan token alınamadı!");
            }
            currentToken = loginData.token;
            tokenExpiration = now + (loginData.expires_in * 1000 || 3600 * 1000);
            rotaCloud.auth(currentToken); // Token’ı kütüphaneye tekrar set et
            logger.info("Yeni token alındı:", currentToken);
        } catch (error) {
            logger.error("ensureToken hatası:", error.message);
            currentToken = null;
            tokenExpiration = null;
            throw error;
        }
    } else {
        logger.info("Mevcut token geçerli:", currentToken);
    }
    return currentToken;
}

export async function initializeRotaCloud() {
    try {
        const loginData = await getRotaToken();
        if (!loginData.token) {
            throw new Error("Rota Cloud’dan token alınamadı!");
        }
        currentToken = loginData.token;
        tokenExpiration = Date.now() + (loginData.expires_in * 1000 || 3600 * 1000);
        rotaCloud.auth(currentToken); // Token’ı kütüphaneye set et
        logger.info("Rota Cloud yetkilendirme ayarlandı:", currentToken);
    } catch (err) {
        logger.error("Rota Cloud yetkilendirme başarısız:", err.message);
        throw err;
    }
}

export async function getCariHesapList({ filter = "ALL", code = "", limit = "", search = "", company_id, user_id, branch_id = [], retryCount = 0 }) {
    try {
        await ensureToken();
        const params = { filter, code, limit, search, company_id: "2", user_id, branch_id: branch_id.join(",") };
        logger.info("getCariHesapList Params:", params);
        const { data } = await rotaCloud.getChkList(params);
        logger.info("Rota Cloud’dan Gelen Veriler:", data);
        return data;
    } catch (error) {
        if (error.response?.status === 429 && retryCount < 3) {
            logger.info(`429 Hatası: 1 saniye beklenip tekrar denenecek... Deneme: ${retryCount + 1}`);
            await sleep(1000);
            return getCariHesapList({ filter, code, limit, search, company_id, user_id, branch_id, retryCount: retryCount + 1 });
        }
        if (error.response?.status === 401 && retryCount < 2) {
            logger.info("401 Hatası: Token yenileniyor...");
            await ensureToken(true);
            return getCariHesapList({ filter, code, limit, search, company_id, user_id, branch_id, retryCount: retryCount + 1 });
        }
        logger.error("getCariHesapList Error Details:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw new Error(error.response?.data?.message || "Rota Cloud’dan cari listesi alınamadı.");
    }
}

export const addCariHesap = async (data, retryCount = 0) => {
    let rotaData = null;
    try {
        const token = await ensureToken(true); // Her zaman token’ı yenile
        if (!token) {
            throw new Error("Rota Cloud token alınamadı!");
        }

        // Frontend’den gelen ham veriyi logla
        logger.info("Frontend’den gelen ham veri:", data);

        // Veri yapısını örnekteki gibi oluştur
        const account = data.account || "Bilinmeyen Kişi";
        const cariCode = data.code || `${account.split(" ")[0]}-${Math.floor(Math.random() * 10000)}`;

        rotaData = {
            user_id: "9", // Rota Cloud Login Data’daki id ile eşleşecek şekilde sabitledik
            account: account,
            code: cariCode,
            phone: data.phone || "",
            phone2: data.phone2 || "",
            gsmno: data.gsmno || data.phone || "",
            fax: data.fax || null,
            vdairesi: data.vdairesi || "",
            vkn: data.vkn || "",
            tckn: data.tckn || "",
            email: data.email || "",
            address: data.address || "ZORUNLU ADRES ALANI",
            city: data.city && !data.city.startsWith("67d") ? data.city : "ADANA",
            state: data.state && !data.state.startsWith("67d") ? data.state : "ALADAĞ",
            zip: data.zip || "",
            country: data.country && !data.country.startsWith("67d") ? data.country : "Türkiye",
            notes: data.notes || "",
            gname: data.gname || "",
            gid: data.gid || "0",
            ozelkod1: data.ozelkod1 || "",
            ozelkod2: data.ozelkod2 || "",
            ozelkod3: data.ozelkod3 || "",
            vade: data.vade || "",
            firmaid: data.firmaid || "2",
            subeid: data.subeid && data.subeid.length > 0 
                ? data.subeid.map(id => ({ subeid: id }))
                : [{ subeid: "1" }],
            adresler: data.adresler || [
                {
                    adresadi: "EV",
                    adres: data.address || "ZORUNLU ADRES ALANI",
                    ilce1: data.state && !data.state.startsWith("67d") ? data.state : "ALADAĞ",
                    sehir1: data.city && !data.city.startsWith("67d") ? data.city : "ADANA",
                    ulke: data.country && !data.country.startsWith("67d") ? data.country : "Türkiye",
                    telefon: data.phone || "",
                    firmaid: data.firmaid || "2",
                },
            ],
            yetkililer: data.yetkililer && data.yetkililer.length > 0 ? data.yetkililer : [
                {
                    name: account.split(" ")[0] || "Bilinmeyen",
                    gorev: "",
                    email: data.email || "",
                    gsmno: data.phone || "",
                    dahili: "",
                    firmaid: data.firmaid || "2",
                },
            ],
        };

        logger.info("addCariHesap çağrıldı, veri:", rotaData);
        logger.info("Kullanılan token:", token);

        const { data: response } = await rotaCloud.postChkAdd(rotaData);
        logger.info("Rota Cloud’dan ekleme yanıtı:", response);
        return response;
    } catch (err) {
        logger.error("addCariHesap hatası:", {
            requestData: data,
            sentData: rotaData,
            status: err.response?.status,
            responseData: err.response?.data,
            message: err.message,
            stack: err.stack,
        });
        throw new Error("Rota Cloud’a cari eklenemedi: " + (err.response?.data?.message || err.message || "Bilinmeyen hata"));
    }
};

export async function updateCariHesap(cariId, cariData, retryCount = 0) {
    try {
        const token = await ensureToken(true);
        if (!token) {
            throw new Error("Rota Cloud token alınamadı!");
        }

        const rotaData = {
            id: cariId,
            user_id: cariData.user_id || "9",
            account: cariData.account || "",
            code: cariData.code || "",
            phone: cariData.phone || "",
            email: cariData.email || "",
            firmaid: cariData.firmaid || "2",
            subeid: cariData.subeid && cariData.subeid.length > 0 ? cariData.subeid : ["1"],
            address: cariData.address || "",
            city: cariData.city || "",
            state: cariData.state || "",
            country: cariData.country || "",
            vkn: cariData.vkn || "",
            tckn: cariData.tckn || "",
            vdairesi: cariData.vdairesi || "",
            adresler: cariData.adresler || [
                {
                    adresadi: "EV",
                    adres: cariData.address || "",
                    ilce1: cariData.state || "",
                    sehir1: cariData.city || "",
                    ulke: cariData.country || "",
                    telefon: cariData.phone || "",
                    firmaid: cariData.firmaid || "2",
                },
            ],
            yetkililer: cariData.yetkililer || [
                {
                    name: cariData.account?.split(" ")[0] || "",
                    gorev: "",
                    email: cariData.email || "",
                    gsmno: cariData.phone || "",
                    dahili: "",
                    firmaid: cariData.firmaid || "2",
                },
            ],
        };

        logger.info("updateCariHesap çağrıldı, veri:", rotaData);
        logger.info("Kullanılan token:", token);

        const { data } = await rotaCloud.putChkUpdate(rotaData);
        logger.info("Rota Cloud’dan güncelleme yanıtı:", data);
        return data;
    } catch (error) {
        if (error.response?.status === 429 && retryCount < 3) {
            logger.info(`429 Hatası: 1 saniye beklenip tekrar denenecek... Deneme: ${retryCount + 1}`);
            await sleep(1000);
            return updateCariHesap(cariId, cariData, retryCount + 1);
        }
        if (error.response?.status === 401 && retryCount < 2) {
            logger.info("401 Hatası: Token yenileniyor...");
            await ensureToken(true);
            return updateCariHesap(cariId, cariData, retryCount + 1);
        }
        logger.error("updateCariHesap hatası:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw new Error(error.response?.data?.message || "Rota Cloud’da cari güncellenemedi.");
    }
}

export async function getCariHesapActions({ user_id, company_id, currency = "TRY", fdate = "", edate = "", cid = "", code = "", types = "", retryCount = 0 }) {
    try {
        await ensureToken();
        const params = { user_id, company_id, currency, fdate, edate, cid, code, types };
        logger.info("getCariHesapActions Params:", params);
        const { data } = await rotaCloud.getChkList(params);
        logger.info("Rota Cloud’dan aksiyon yanıtı:", data);
        return data;
    } catch (error) {
        if (error.response?.status === 429 && retryCount < 3) {
            logger.info(`429 Hatası: 1 saniye beklenip tekrar denenecek... Deneme: ${retryCount + 1}`);
            await sleep(1000);
            return getCariHesapActions({ user_id, company_id, currency, fdate, edate, cid, code, types, retryCount: retryCount + 1 });
        }
        if (error.response?.status === 401 && retryCount < 2) {
            logger.info("401 Hatası: Token yenileniyor...");
            await ensureToken(true);
            return getCariHesapActions({ user_id, company_id, currency, fdate, edate, cid, code, types, retryCount: retryCount + 1 });
        }
        logger.error("getCariHesapActions hatası:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw new Error(error.response?.data?.message || "Rota Cloud’dan cari aksiyonları alınamadı.");
    }
}

export async function syncRotaCloud(companyId, userId, branchId = [], retryCount = 0) {
    try {
        await ensureToken();
        logger.info("Rota Cloud Senkronizasyonu Başladı:", { companyId, userId, branchId });

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

        // Rota Cloud’dan yerel veri tabanına senkronizasyon
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

        // Yerel veri tabanından Rota Cloud’a senkronizasyon
        const localCaris = await AdayCari.find({ company: companyId, synced: false });
        logger.info("Senkronize edilecek yerel cari sayısı:", localCaris.length);

        for (const localCari of localCaris) {
            try {
                const cariData = {
                    user_id: userId || "9",
                    account: localCari.chUnvani,
                    code: localCari.adayKodu?.toString(),
                    phone: localCari.yetkiliTelefon || "",
                    email: localCari.yetkiliEmail || "",
                    address: localCari.adres || "",
                    city: localCari.il || "ADANA",
                    state: localCari.ilce || "ALADAĞ",
                    country: localCari.ulke || "Türkiye",
                    vdairesi: localCari.vergiDairesi || "",
                    vkn: localCari.vergiNo || "",
                    tckn: localCari.tcKimlikNo || "",
                    notes: localCari.aciklama || "",
                    firmaid: "2",
                    subeid: ["1"].map(id => ({ subeid: id })), // Rota Cloud’un beklediği format
                    adresler: [
                        {
                            adresadi: "EV",
                            adres: localCari.adres || "ZORUNLU ADRES ALANI",
                            ilce1: localCari.ilce || "ALADAĞ",
                            sehir1: localCari.il || "ADANA",
                            ulke: localCari.ulke || "Türkiye",
                            telefon: localCari.yetkiliTelefon || "",
                            firmaid: "2",
                        },
                    ],
                    yetkililer: localCari.yetkiliAdiSoyadi ? [{
                        name: localCari.yetkiliAdiSoyadi,
                        gorev: localCari.yetkiliGorevi || "",
                        email: localCari.yetkiliEmail || "",
                        gsmno: localCari.yetkiliTelefon || "",
                        dahili: "",
                        firmaid: "2",
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
            } catch (cariErr) {
                logger.error("Cari senkronizasyon hatası:", {
                    cariCode: localCari.adayKodu,
                    message: cariErr.message,
                    stack: cariErr.stack,
                });
                // Hata olsa bile diğer carilere devam et
                continue;
            }
        }

        logger.info("Rota Cloud ile senkronizasyon tamamlandı");
        return { success: true, message: "Senkronizasyon tamamlandı" };
    } catch (err) {
        if (err.response?.status === 429 && retryCount < 3) {
            logger.info(`429 Hatası: 1 saniye beklenip tekrar denenecek... Deneme: ${retryCount + 1}`);
            await sleep(1000);
            return syncRotaCloud(companyId, userId, branchId, retryCount + 1);
        }
        if (err.response?.status === 401 && retryCount < 2) {
            logger.info("401 Hatası: Token yenileniyor...");
            await ensureToken(true);
            return syncRotaCloud(companyId, userId, branchId, retryCount + 1);
        }
        logger.error("Rota Cloud Senkronizasyon Hatası:", {
            message: err.message,
            stack: err.stack,
        });
        throw err;
    }
}

initializeRotaCloud();
