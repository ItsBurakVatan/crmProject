import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:7700/api",
    withCredentials: true, // Cookie’lerin otomatik gönderilmesini sağlar
});

// Rota Cloud için özel fonksiyonlar
export const getCariHesapList = () => api.get("/rota/cari-hesap/list");
export const addCariHesap = (data) => api.post("/rota/cari-hesap/add", data);
export const updateCariHesap = (id, data) => api.put(`/rota/cari-hesap/update/${id}`, data);
export const getCariHesapActions = () => api.get("/rota/cari-hesap/actions");

export default api;
