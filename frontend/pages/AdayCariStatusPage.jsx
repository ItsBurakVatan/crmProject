import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import Navbar from "./Navbar"; // Doğru yol
import "../styles/AdayCariStatusPage.css";

const AdayCariStatusPage = () => {
    const [statusCounts, setStatusCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStatusCounts = async () => {
            if (!user || !user._id) {
                console.log("User ID yok, yönlendirme yapılıyor...");
                navigate("/login");
                return;
            }
            try {
                const res = await axios.get(`http://localhost:7700/api/adaycaris/status-counts/${user._id}`);
                console.log("Status counts response:", res.data);
                setStatusCounts(res.data);
            } catch (err) {
                console.error("Status counts error:", err);
                setError(err.response?.data?.message || "Durum sayıları alınırken hata oluştu.");
            } finally {
                setLoading(false);
            }
        };
        fetchStatusCounts();
    }, [user, navigate]);

    if (loading) return <div className="loading">Yükleniyor...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="status-page">
            <Navbar />
            <div className="status-container">
                {Object.keys(statusCounts).map((statusName) => (
                    <div className="status-panel" key={statusName}>
                        <h3>{statusName.charAt(0).toUpperCase() + statusName.slice(1)}</h3>
                        <span className="count">{statusCounts[statusName]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdayCariStatusPage;
