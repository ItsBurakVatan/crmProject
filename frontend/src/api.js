import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:7700/api",
    withCredentials: true,
});

export default api;
