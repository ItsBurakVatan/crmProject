import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiError } from "../error.js"; // Yeni ApiError import edildi
import logger from "../utils/logger.js"; // Logger eklendi

export const register = async (req, res, next) => {
    try {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        const userCount = await User.countDocuments();
        const role = userCount === 0 ? "admin" : "staff";

        const newUser = new User({
            ...req.body,
            password: hash,
            role,
        });

        const savedUser = await newUser.save();
        const { password, ...otherDetails } = savedUser._doc;
        logger.info("Yeni kullanıcı oluşturuldu:", savedUser._id);
        res.status(200).json({ details: otherDetails });
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.keys(err.errors).map((key) => ({
                field: key,
                message: err.errors[key].message,
            }));
            return next(ApiError.badRequest("Geçersiz veri girişi!", errors));
        }
        if (err.code === 11000) {
            return next(ApiError.badRequest("Bu kullanıcı adı veya email zaten kullanılıyor!"));
        }
        logger.error("Kullanıcı oluşturulamadı:", err.message);
        next(ApiError.internal("Kullanıcı oluşturulamadı!", { error: err.message }));
    }
};

export const login = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            throw ApiError.notFound("Kullanıcı bulunamadı!");
        }

        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordCorrect) {
            throw ApiError.badRequest("Yanlış şifre!");
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        const { password, ...otherDetails } = user._doc;

        logger.info("Kullanıcı giriş yaptı:", user._id);
        res.cookie("access_token", token, { httpOnly: true })
            .status(200)
            .json({ details: { ...otherDetails } });
    } catch (err) {
        logger.error("Giriş yapılamadı:", err.message);
        next(err instanceof ApiError ? err : ApiError.internal("Giriş yapılamadı!", { error: err.message }));
    }
};

// Kullanıcıları Listeleme (sadece admin için)
export const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find({}, { password: 0 })
            .skip(skip)
            .limit(limit);

        logger.info("Kullanıcılar listelendi:", { total, page });
        res.status(200).json({
            data: users,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        logger.error("Kullanıcılar alınamadı:", err.message);
        next(ApiError.internal("Kullanıcılar alınamadı!", { error: err.message }));
    }
};

// Kullanıcı Rolünü Güncelleme (sadece admin için)
export const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!["admin", "manager", "staff"].includes(role)) {
            throw ApiError.badRequest("Geçersiz rol!");
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, select: "-password" }
        );

        if (!updatedUser) {
            throw ApiError.notFound("Kullanıcı bulunamadı!");
        }

        logger.info("Kullanıcı rolü güncellendi:", { id: req.params.id, role });
        res.status(200).json(updatedUser);
    } catch (err) {
        logger.error("Rol güncellenemedi:", err.message);
        next(err instanceof ApiError ? err : ApiError.internal("Rol güncellenemedi!", { error: err.message }));
    }
};
