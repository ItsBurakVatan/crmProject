import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createError } from "../error.js";

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
        const { password, ...otherDetails } = savedUser._doc; // Kullanıcı bilgilerini dön
        res.status(200).json({ details: otherDetails });
    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.keys(err.errors).map(key => ({
                field: key,
                message: err.errors[key].message
            }));
            return next(createError(400, "Geçersiz veri girişi!", errors));
        }
        if (err.code === 11000) {
            return next(createError(400, "Bu kullanıcı adı veya email zaten kullanılıyor!"));
        }
        next(createError(500, "Kullanıcı oluşturulamadı!", { error: err.message }));
    }
};

export const login = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return next(createError(404, "Kullanıcı bulunamadı!"));

        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordCorrect) return next(createError(400, "Yanlış şifre!"));

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        const { password, ...otherDetails } = user._doc;

        res.cookie("access_token", token, { httpOnly: true })
           .status(200)
           .json({ details: { ...otherDetails } });
    } catch (err) {
        next(createError(500, "Giriş yapılamadı!", { error: err.message }));
    }
};

// Yeni endpoint: Kullanıcıları listeleme (sadece admin için)
export const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find({}, { password: 0 }) // Şifreyi hariç tut
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            data: users,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        next(createError(500, "Kullanıcılar alınamadı!", { error: err.message }));
    }
};

// Yeni endpoint: Kullanıcı rolünü güncelleme (sadece admin için)
export const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!["admin", "manager", "staff"].includes(role)) {
            return next(createError(400, "Geçersiz rol!"));
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, select: "-password" } // Şifreyi hariç tut
        );

        if (!updatedUser) {
            return next(createError(404, "Kullanıcı bulunamadı!"));
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        next(createError(500, "Rol güncellenemedi!", { error: err.message }));
    }
};
