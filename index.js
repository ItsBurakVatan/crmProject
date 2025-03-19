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

app.use(cors({
    origin: "http://localhost:3000", // Frontend URL
    credentials: true, // Cookie’lerin gönderilmesine izin ver
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/adaycaris", adayCariRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/taskTypes", taskTypesRoutes);
app.use("/api/groups", groupsRoutes);

app.use((err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "Bir hata oluştu!";
    const errorDetails = err.details || null;

    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        ...(errorDetails && { details: errorDetails }),
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

app.listen(7700, () => {
    connect();
    console.log("Listening on port 7700");
});