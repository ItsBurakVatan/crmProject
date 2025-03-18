import { EventEmitter } from "events";
EventEmitter.defaultMaxListeners = 15; // Varsayılan 10'dan 15'e çıkar
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import adayCariRoutes from "./routes/adaycaris.js";
import taskRoutes from "./routes/tasks.js";
import userRoutes from "./routes/user.js"; // Kullanıcı rotaları
import statusRoutes from "./routes/status.js"; // Yeni eklenen durum rotası
import taskTypesRoutes from "./routes/taskTypes.js"; // Yeni eklenen görev türü rotası
import groupsRoutes from "./routes/groups.js"; // Yeni eklenen grup rotası


dotenv.config();

const app = express();

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log("Connected to MongoDB:", mongoose.connection.db.databaseName);
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};

mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected!");
});

// Middleware'ler - CORS en başta olmalı
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json()); // JSON parsing
app.use(cookieParser());

// Rotalar
app.use("/api/adaycaris", adayCariRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/taskTypes", taskTypesRoutes);
app.use("/api/groups", groupsRoutes);


// Hata yakalama
app.use((err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "Something went wrong!";
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: err.stack,
    });
});

app.listen(7700, () => {
    connect();
    console.log("Listening on port 7700");
});