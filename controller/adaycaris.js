import mongoose from "mongoose";
import AdayCari from "../models/AdayCari.js";
import Country from "../models/countries.js";
import City from "../models/cities.js";
import Town from "../models/Town.js";
import { ApiError } from "../error.js";
import { getCariHesapList, addCariHesap } from "../services/rotaCloudService.js";
import logger from "../utils/logger.js";

const findCountryIdByName = async (name) => {
    if (!name) {
        logger.warn("Ülke adı boş, varsayılan değer kullanılacak.");
        const defaultCountry = await Country.findOne({ name: "Türkiye" });
        return defaultCountry ? defaultCountry._id : null;
    }

    // Rota Cloud’dan gelen ülke kodlarını eşleştirme
    const countryMapping = {
        "TR": "Türkiye",
        "GE": "Gürcistan",
        // Diğer ülke kodlarını buraya ekleyebilirsiniz
    };

    const mappedName = countryMapping[name] || name;
    const country = await Country.findOne({ name: { $regex: new RegExp(`^${mappedName}$`, "i") } });
    if (!country) {
        logger.warn(`Ülke bulunamadı: ${name}, varsayılan değer kullanılacak.`);
        const defaultCountry = await Country.findOne({ name: "Türkiye" });
        return defaultCountry ? defaultCountry._id : null;
    }
    return country._id; // ObjectId döndür
};

const findCityIdByName = async (name, countryId) => {
    if (!name) {
        logger.warn("Şehir adı boş, varsayılan değer kullanılacak.");
        return "";
    }
    if (!countryId) {
        logger.warn("Ülke ID'si bulunamadı, şehir aranamayacak.");
        return name;
    }
    const city = await City.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, country: countryId });
    if (!city) {
        logger.warn(`Şehir bulunamadı: ${name}, ülke: ${countryId}`);
    }
    return city?.name || name;
};

const findTownIdByName = async (name, cityId) => {
    if (!name) {
        logger.warn("İlçe adı boş, varsayılan değer kullanılacak.");
        return "";
    }
    if (!cityId) {
        logger.warn("Şehir ID'si bulunamadı, ilçe aranamayacak.");
        return name;
    }
    const town = await Town.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, city: cityId });
    if (!town) {
        logger.warn(`İlçe bulunamadı: ${name}, şehir: ${cityId}`);
    }
    return town?.name || name;
};

export const getAdayCaris = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const all = req.query.all === "true" && req.user.role === "admin";
        const noPagination = req.query.noPagination === "true";

        let filter = {};
        let total;

        if (!all) {
            filter.company = "2";
            if (req.user.role === "staff") {
                filter.sorumluPersonel = req.user.id;
            }
            logger.info("Filtreleme uygulandı:", filter);
            total = await AdayCari.countDocuments(filter);
            logger.info(`Filtrelenmiş toplam kayıt: ${total}`);
        } else {
            total = await AdayCari.countDocuments();
            logger.info(`Tüm kayıtlar için toplam: ${total}`);
        }

        const localAdayCaris = await AdayCari.find(filter)
            .populate("sorumluPersonel")
            .populate("durumu")
            .populate("cariHesapGrubu")
            .skip(noPagination ? 0 : skip)
            .limit(noPagination ? 0 : limit);

        logger.info(`Yerel veritabanından çekilen kayıtlar: ${localAdayCaris.length}`);

        let mergedCaris = [...localAdayCaris];

        if (!all) {
            try {
                const BRANCH_ID = JSON.parse(process.env.BRANCH_ID); // ["1"]

                const rotaCaris = await getCariHesapList({
                    filter: "ALL",
                    company_id: "2",
                    user_id: "9",
                    branch_id: BRANCH_ID,
                    limit: noPagination ? "" : `${skip},${limit}`,
                });

                logger.info(`Rota Cloud’dan gelen ham veri: ${JSON.stringify(rotaCaris, null, 2)}`);

                if (rotaCaris?.result && rotaCaris.result.length > 0) {
                    for (const rotaCari of rotaCaris.result) {
                        try {
                            logger.info(`İşlenen Rota Cari: ${JSON.stringify(rotaCari, null, 2)}`);

                            const exists = await AdayCari.findOne({ chUnvani: rotaCari.account });
                            const countryId = await findCountryIdByName(rotaCari.country || "TR"); // ObjectId
                            const countryName = countryId ? (await Country.findById(countryId))?.name || "Türkiye" : "Türkiye"; // Ülke adını string olarak al
                            const cityId = await findCityIdByName(rotaCari.city, countryId);
                            const townId = await findTownIdByName(rotaCari.state, cityId);

                            // Telefon bilgisini adresler dizisinden almayı dene
                            let phoneFromAdresler = "";
                            if (rotaCari.adresler && rotaCari.adresler.length > 0) {
                                phoneFromAdresler = rotaCari.adresler[0]?.telefon || "";
                            }

                            if (exists) {
                                // Mevcut kaydı güncelle
                                await AdayCari.updateOne(
                                    { _id: exists._id },
                                    {
                                        $set: {
                                            adres: rotaCari.address || exists.adres || "",
                                            yetkiliAdiSoyadi: rotaCari.yetkililer?.[0]?.name || exists.yetkiliAdiSoyadi || "",
                                            yetkiliGorevi: rotaCari.yetkililer?.[0]?.title || exists.yetkiliGorevi || "",
                                            yetkiliTelefon: phoneFromAdresler || rotaCari.phone || rotaCari.gsmno || exists.yetkiliTelefon || "",
                                            yetkiliEmail: rotaCari.email || exists.yetkiliEmail || "",
                                            vergiDairesi: rotaCari.vdairesi || exists.vergiDairesi || "",
                                            vergiNo: rotaCari.vkn || exists.vergiNo || "",
                                            tcKimlikNo: rotaCari.tckn || exists.tcKimlikNo || "",
                                            aciklama: rotaCari.notes || exists.aciklama || "",
                                            sube: rotaCari.subeid?.[0]?.subeid || exists.sube || "",
                                            ulke: countryName || exists.ulke || "Türkiye", // String olarak kaydet
                                            il: cityId || exists.il || "",
                                            ilce: townId || exists.ilce || "",
                                            city: rotaCari.city || exists.city || "",
                                            zip: rotaCari.zip || exists.zip || "",
                                            synced: false,
                                        },
                                    }
                                );
                                logger.info(`Mevcut cari güncellendi: ${exists._id}`);
                                continue;
                            }

                            const newCari = new AdayCari({
                                adayKodu: rotaCari.code ? parseInt(rotaCari.code) : (await AdayCari.countDocuments()) + 1,
                                chUnvani: rotaCari.account || "Bilinmeyen Hesap",
                                adres: rotaCari.address || "",
                                yetkiliAdiSoyadi: rotaCari.yetkililer?.[0]?.name || "",
                                yetkiliGorevi: rotaCari.yetkililer?.[0]?.title || "",
                                yetkiliTelefon: phoneFromAdresler || rotaCari.phone || rotaCari.gsmno || "",
                                yetkiliEmail: rotaCari.email || "",
                                vergiDairesi: rotaCari.vdairesi || "",
                                vergiNo: rotaCari.vkn || "",
                                tcKimlikNo: rotaCari.tckn || "",
                                aciklama: rotaCari.notes || "",
                                company: "2",
                                sube: rotaCari.subeid?.[0]?.subeid || "",
                                ulke: countryName || "Türkiye", // String olarak kaydet
                                il: cityId || "",
                                ilce: townId || "",
                                city: rotaCari.city || "",
                                zip: rotaCari.zip || "",
                                synced: false,
                                sorumluPersonel: null,
                                durumu: null,
                                cariHesapGrubu: null,
                                musteriHikayesi: "",
                            });

                            await newCari.save();
                            logger.info(`Yeni cari kaydedildi: ${newCari._id}`);

                            try {
                                await addCariHesap({
                                    account: newCari.chUnvani,
                                    code: newCari.adayKodu.toString(),
                                    firmaid: "2",
                                    user_id: req.user.id,
                                });
                                await AdayCari.updateOne({ _id: newCari._id }, { $set: { synced: true } });
                                logger.info("Rota Cloud’a cari eklendi ve synced işaretlendi:", newCari.adayKodu);
                            } catch (syncError) {
                                logger.error(`Rota Cloud sync hatası (${rotaCari.account}): ${syncError.message}`);
                            }

                            mergedCaris.push(newCari);
                        } catch (error) {
                            logger.error(`Kayıt işlenirken hata (${rotaCari.account}): ${error.message}`);
                            continue;
                        }
                    }
                } else {
                    logger.warn("Rota Cloud’dan veri alınamadı veya veri boş.");
                }
            } catch (rotaErr) {
                logger.error("Rota Cloud’dan veri alınamadı:", rotaErr.message);
            }
        }

        logger.info(`Toplam kayıt (mergedCaris): ${mergedCaris.length}, Sayfa: ${page}`);
        res.status(200).json({
            data: mergedCaris,
            total: total,
            page: noPagination ? 1 : page,
            pages: noPagination ? 1 : Math.ceil(total / limit),
        });
    } catch (err) {
        logger.error("getAdayCaris hatası:", err.message);
        next(ApiError.internal(err.message || "Aday cariler alınamadı!", { error: err.message }));
    }
};

export const createAdayCari = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const adayCariData = req.body;

        const existingCari = await AdayCari.findOne({ adayKodu: adayCariData.adayKodu });
        if (existingCari) {
            throw ApiError.badRequest(`Aday kodu ${adayCariData.adayKodu} zaten kullanılıyor.`);
        }

        const newAdayCari = new AdayCari({
            ...adayCariData,
            company: "2",
            synced: false,
        });

        const savedAdayCari = await newAdayCari.save({ session });
        logger.info("Yerel veritabanına kaydedildi:", savedAdayCari._id);

        const countryName = savedAdayCari.ulke || "Türkiye"; // ulke zaten string
        const cityName = savedAdayCari.il || "";
        const stateName = savedAdayCari.ilce || "";

        const cariData = {
            user_id: "9",
            account: savedAdayCari.chUnvani,
            code: savedAdayCari.adayKodu?.toString(),
            phone: savedAdayCari.yetkiliTelefon || "",
            email: savedAdayCari.yetkiliEmail || "",
            address: savedAdayCari.adres || "",
            city: cityName,
            state: stateName,
            country: countryName,
            vdairesi: savedAdayCari.vergiDairesi || "",
            vkn: savedAdayCari.vergiNo || "",
            tckn: savedAdayCari.tcKimlikNo || "",
            notes: savedAdayCari.aciklama || "",
            firmaid: "2",
            subeid: ["1"],
            yetkililer: savedAdayCari.yetkiliAdiSoyadi
                ? [{ name: savedAdayCari.yetkiliAdiSoyadi, title: savedAdayCari.yetkiliGorevi || "" }]
                : [],
        };

        logger.info("Rota Cloud’a veri hazırlanır:", cariData);
        const rotaResponse = await addCariHesap(cariData);

        if (rotaResponse.message !== "Chk was created." || !rotaResponse.result?.startsWith("2")) {
            throw ApiError.internal(`Rota Cloud ekleme başarısız: Beklenmeyen yanıt - ${JSON.stringify(rotaResponse)}`);
        }

        await AdayCari.updateOne(
            { _id: savedAdayCari._id },
            { $set: { synced: true } },
            { session }
        );

        await session.commitTransaction();
        res.status(201).json(savedAdayCari);
    } catch (error) {
        await session.abortTransaction();
        logger.error("Rota Cloud’a ekleme başarısız:", { message: error.message, stack: error.stack });
        res.status(error.statusCode || 500).json({
            message: error.message || "Rota Cloud’a cari eklenemedi",
            details: error.details || [],
        });
    } finally {
        session.endSession();
    }
};

export const updateAdayCari = async (req, res, next) => {
    try {
        const updatedAdayCari = await AdayCari.findByIdAndUpdate(
            req.params.id,
            { $set: { ...req.body, synced: false } },
            { new: true }
        )
            .populate("sorumluPersonel")
            .populate("durumu")
            .populate("cariHesapGrubu");

        if (!updatedAdayCari) {
            throw ApiError.notFound("Güncellenecek aday cari bulunamadı!");
        }

        const countryName = updatedAdayCari.ulke || "Türkiye"; // ulke zaten string
        const cityName = updatedAdayCari.il || "";
        const stateName = updatedAdayCari.ilce || "";

        const cariData = {
            user_id: "9",
            account: updatedAdayCari.chUnvani,
            code: updatedAdayCari.adayKodu?.toString(),
            phone: updatedAdayCari.yetkiliTelefon || "",
            email: updatedAdayCari.yetkiliEmail || "",
            address: updatedAdayCari.adres || "",
            city: cityName,
            state: stateName,
            country: countryName,
            vdairesi: updatedAdayCari.vergiDairesi || "",
            vkn: updatedAdayCari.vergiNo || "",
            tckn: updatedAdayCari.tcKimlikNo || "",
            notes: updatedAdayCari.aciklama || "",
            firmaid: "2",
            subeid: ["1"],
            yetkililer: updatedAdayCari.yetkiliAdiSoyadi
                ? [{ name: updatedAdayCari.yetkiliAdiSoyadi, title: updatedAdayCari.yetkiliGorevi || "" }]
                : [],
        };

        logger.info("Rota Cloud’a güncelleme verisi hazırlanır:", cariData.account);
        const rotaResponse = await addCariHesap(cariData);

        if (rotaResponse.message !== "Chk was created." && !["201", "202", "204"].includes(rotaResponse.result)) {
            throw ApiError.internal(`Rota Cloud güncelleme başarısız: Beklenmeyen yanıt - ${JSON.stringify(rotaResponse)}`);
        }

        await AdayCari.updateOne({ _id: updatedAdayCari._id }, { $set: { synced: true } });

        res.status(200).json(updatedAdayCari);
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.keys(err.errors).map((key) => ({
                field: key,
                message: err.errors[key].message,
            }));
            return next(ApiError.badRequest("Geçersiz veri girişi!", errors));
        }
        if (err.code === 11000) {
            return next(ApiError.badRequest("Bu aday kodu zaten mevcut!"));
        }
        next(err instanceof ApiError ? err : ApiError.internal(err.message || "Aday cari güncellenemedi!", { error: err.message }));
    }
};

export const deleteAdayCari = async (req, res, next) => {
    try {
        const deletedAdayCari = await AdayCari.findByIdAndDelete(req.params.id);
        if (!deletedAdayCari) {
            throw ApiError.notFound("Silinecek aday cari bulunamadı!");
        }
        res.status(200).json({ message: "Aday cari başarıyla silindi" });
    } catch (err) {
        next(err instanceof ApiError ? err : ApiError.internal("Aday cari silinemedi!", { error: err.message }));
    }
};
