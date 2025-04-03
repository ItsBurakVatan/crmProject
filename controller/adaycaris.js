import mongoose from "mongoose";
import AdayCari from "../models/AdayCari.js";
import Country from "../models/countries.js";
import City from "../models/cities.js";
import Town from "../models/Town.js";
import { ApiError } from "../error.js"; // Yeni ApiError import edildi
import { getCariHesapList, addCariHesap } from "../services/rotaCloudService.js";
import logger from "../utils/logger.js"; // Logger eklendi

const findCountryIdByName = async (name) => {
    if (!name) return null;
    const country = await Country.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    return country?._id || null;
};

const findCityIdByName = async (name, countryId) => {
    if (!name || !countryId) return null;
    const city = await City.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, country: countryId });
    return city?._id || null;
};

const findTownIdByName = async (name, cityId) => {
    if (!name || !cityId) return null;
    const town = await Town.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, city: cityId });
    return town?._id || null;
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

        if (!all && req.params.companyId) {
            filter.company = req.params.companyId;
            if (req.user.role === "staff") {
                filter.sorumluPersonel = req.user.id;
            }
            total = await AdayCari.countDocuments(filter);
        } else if (all) {
            total = await AdayCari.countDocuments();
        } else {
            total = await AdayCari.countDocuments();
        }

        const localAdayCaris = await AdayCari.find(filter)
            .populate("ulke")
            .populate("il")
            .populate("ilce")
            .populate("sube")
            .populate("sorumluPersonel")
            .populate("durumu")
            .populate("cariHesapGrubu")
            .skip(noPagination ? 0 : skip)
            .limit(noPagination ? 0 : limit);

        let mergedCaris = [...localAdayCaris];

        if (!all && req.params.companyId) {
            try {
                const rotaCaris = await getCariHesapList({
                    filter: "ALL",
                    company_id: "2",
                    user_id: "9",
                    branch_id: localAdayCaris
                        .map((cari) => cari.sube?._id?.toString())
                        .filter((id) => id !== undefined && id !== null),
                    limit: noPagination ? "" : `${skip},${limit}`,
                });

                if (rotaCaris?.result) {
                    for (const rotaCari of rotaCaris.result) {
                        const exists = await AdayCari.findOne({ chUnvani: rotaCari.account });
                        if (!exists) {
                            const countryId = await findCountryIdByName(rotaCari.country);
                            const cityId = await findCityIdByName(rotaCari.city, countryId);
                            const townId = await findTownIdByName(rotaCari.state, cityId);

                            const newCari = new AdayCari({
                                adayKodu: rotaCari.code ? parseInt(rotaCari.code) : (await AdayCari.countDocuments()) + 1,
                                chUnvani: rotaCari.account,
                                adres: rotaCari.address,
                                yetkiliAdiSoyadi: rotaCari.yetkililer?.[0]?.name,
                                yetkiliGorevi: rotaCari.yetkililer?.[0]?.title,
                                yetkiliTelefon: rotaCari.phone,
                                yetkiliEmail: rotaCari.email,
                                vergiDairesi: rotaCari.vdairesi,
                                vergiNo: rotaCari.vkn,
                                tcKimlikNo: rotaCari.tckn,
                                aciklama: rotaCari.notes,
                                company: req.params.companyId || req.user.company,
                                sube: rotaCari.subeid?.[0],
                                ulke: countryId,
                                il: cityId,
                                ilce: townId,
                                synced: false,
                            });
                            await newCari.save();

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
                                logger.error("Rota Cloud sync hatası:", syncError.message);
                            }

                            mergedCaris.push(newCari);
                        }
                    }
                }
            } catch (rotaErr) {
                logger.error("Rota Cloud’dan veri alınamadı:", rotaErr.message);
            }
        }

        logger.info(`Aday cariler alındı: Toplam ${mergedCaris.length} kayıt, Sayfa: ${page}`);
        res.status(200).json({
            data: noPagination ? mergedCaris : mergedCaris.slice(skip, skip + limit),
            total: mergedCaris.length,
            page: noPagination ? 1 : page,
            pages: noPagination ? 1 : Math.ceil(mergedCaris.length / limit),
        });
    } catch (err) {
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
            company: adayCariData.company || "67d95e0e5b7d53eb87c05938",
            synced: false,
        });

        const savedAdayCari = await newAdayCari.save({ session });
        logger.info("Yerel veritabanına kaydedildi:", savedAdayCari._id);

        const cariData = {
            user_id: "9",
            account: savedAdayCari.chUnvani,
            code: savedAdayCari.adayKodu?.toString(),
            phone: savedAdayCari.yetkiliTelefon || "",
            email: savedAdayCari.yetkiliEmail || "",
            address: savedAdayCari.adres || "Varsayılan Adres",
            city: "İzmir",
            state: "Tire",
            country: "Türkiye",
            vdairesi: savedAdayCari.vergiDairesi || "Varsayılan Vergi Dairesi",
            vkn: savedAdayCari.vergiNo || "1234567890",
            tckn: savedAdayCari.tcKimlikNo || "",
            notes: savedAdayCari.aciklama || "",
            firmaid: "2",
            subeid: ["1"],
            yetkililer: savedAdayCari.yetkiliAdiSoyadi
                ? [{ name: savedAdayCari.yetkiliAdiSoyadi, title: savedAdayCari.yetkiliGorevi || "" }]
                : [],
        };

        logger.info("Rota Cloud’a veri hazırlanır:", cariData.account);
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
            .populate("ulke")
            .populate("il")
            .populate("ilce")
            .populate("sube")
            .populate("sorumluPersonel")
            .populate("durumu")
            .populate("cariHesapGrubu");

        if (!updatedAdayCari) {
            throw ApiError.notFound("Güncellenecek aday cari bulunamadı!");
        }

        const cariData = {
            user_id: "9",
            account: updatedAdayCari.chUnvani, // savedAdayCari yerine updatedAdayCari
            code: updatedAdayCari.adayKodu?.toString(),
            phone: updatedAdayCari.yetkiliTelefon || "",
            email: updatedAdayCari.yetkiliEmail || "",
            address: updatedAdayCari.adres || "Varsayılan Adres",
            city: updatedAdayCari.il?.name || "İzmir", // Populate edilmişse name kullanılır
            state: updatedAdayCari.ilce?.name || "Tire",
            country: updatedAdayCari.ulke?.name || "Türkiye",
            vdairesi: updatedAdayCari.vergiDairesi || "Varsayılan Vergi Dairesi",
            vkn: updatedAdayCari.vergiNo || "1234567890",
            tckn: updatedAdayCari.tcKimlikNo || "",
            notes: updatedAdayCari.aciklama || "",
            firmaid: "2",
            subeid: ["1"],
            yetkililer: updatedAdayCari.yetkiliAdiSoyadi
                ? [{ name: updatedAdayCari.yetkiliAdiSoyadi, title: updatedAdayCari.yetkiliGorevi || "" }]
                : [],
        };

        logger.info("Rota Cloud’a güncelleme verisi hazırlanır:", cariData.account);
        const rotaResponse = await addCariHesap(cariData); // Not: Bu aslında bir güncelleme olmalı, add yerine update kullanılabilir

        // Rota Cloud yanıtını kontrol et
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
