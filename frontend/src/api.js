import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:7700/api",
    withCredentials: true, // Cookie’lerin otomatik gönderilmesini sağlar
});

export default api;
