import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import adayCariRoutes from "./routes/adaycaris.js";
import taskRoutes from "./routes/tasks.js";
import userRoutes from "./routes/user.js";
import statusRoutes from "./routes/status.js";
import taskTypesRoutes from "./routes/taskTypes.js";
import groupsRoutes from "./routes/groups.js";
import rolesRouter from "./routes/roles.js";
import rotaRoutes from "./routes/rotaRoutes.js";
import { getRotaToken, syncRotaCloud } from "./services/rotaCloudService.js";
import { errorHandler } from "./error.js"; // Yeni errorHandler import edildi
import logger from "./utils/logger.js"; // Logger eklendi

dotenv.config();

const app = express();

// MongoDB bağlantısı
const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        logger.info("Connected to MongoDB:", mongoose.connection.db.databaseName);
    } catch (error) {
        logger.error("MongoDB connection error:", error.message);
        throw error;
    }
};

// Rota Cloud başlatma ve başlangıç senkronizasyonu
async function initializeRotaCloud() {
    try {
        logger.info("Rota Cloud Username:", process.env.ROTA_USERNAME);
        logger.info("Rota Cloud Password:", process.env.ROTA_PASSWORD ? "[HIDDEN]" : "MISSING");
        const loginData = await getRotaToken(process.env.ROTA_USERNAME, process.env.ROTA_PASSWORD);
        logger.info("Rota Cloud Login Data:", loginData);

        // Varsayılan companyId ve userId (örneğin veritabanındaki bir admin kullanıcısından)
        const companyId = "67d95e0e5b7d53eb87c05938"; // Veritabanındaki company ID
        const userId = loginData.id; // Token’dan gelen user ID (örneğin "9")
        const branchId = ["67d2ba68b88ab7be6db71238"]; // Veritabanındaki sube ID
        await syncRotaCloud(companyId, userId, branchId);
        logger.info("Başlangıç senkronizasyonu tamamlandı.");
    } catch (error) {
        logger.error("Rota Cloud başlatma veya senkronizasyon hatası:", error.message);
    }
}

// Uygulama başlatma
async function initializeApp() {
    try {
        await connect();
        await initializeRotaCloud();
    } catch (error) {
        logger.error("Uygulama başlatma hatası:", error.message);
        process.exit(1);
    }
}

// Middleware’ler
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rotalar
app.use("/api/adaycaris", adayCariRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/taskTypes", taskTypesRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/roles", rolesRouter);
app.use("/api/rota", rotaRoutes);

// Hata yönetimi (yeni errorHandler kullanıyoruz)
app.use(errorHandler);

// Sunucuyu başlat
const PORT = process.env.PORT || 7700;
app.listen(PORT, () => {
    logger.info(`Sunucu ${PORT} portunda çalışıyor`);
    initializeApp();
});
