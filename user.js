import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { createError } from "../error.js";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
    try {
        console.log("Kayıt isteği:", req.body);
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) return res.status(409).json({ message: "Bu email ile zaten bir kullanıcı var!" });

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hash,
        });

        const savedUser = await newUser.save();
        console.log("Kaydedilen kullanıcı:", savedUser);
        res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu." });
    } catch (err) {
        console.error("Kayıt hatası:", err);
        next(createError(500, err.message || "Kayıt sırasında hata oluştu."));
    }
};

export const login = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return next(createError(404, "Kullanıcı bulunamadı!"));

        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordCorrect) return next(createError(400, "Yanlış şifre veya kullanıcı adı!"));

        const token = jwt.sign(
            { id: user._id, role: user.role }, // Role ekleniyor
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const { password, ...otherDetails } = user._doc;
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })
        .status(200)
        .json({ details: { ...otherDetails }, token });
    } catch (err) {
        next(createError(500, err.message || "Giriş sırasında hata oluştu."));
    }
};