import React from "react";
import Navbar from "./Navbar";
import useFetch from "../useFetch";
import { AuthContext } from "../authContext";
import "../styles/reports.css";
import { useNavigate } from "react-router-dom";

const Reports = ({ reportType }) => {
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();

    const reportEndpoints = {
        "tasks": `/tasks/completion-report`,
        "users": `/users/${user?._id}/activity-report`,
        "customer-status": `/adaycaris/${user?._id}/status-report`,
    };

    const reportTitles = {
        "tasks": "Görev Tamamlama Raporu",
        "users": "Kullanıcı Aktivite Raporu",
        "customer-status": "Müşteri Durum Özeti Raporu",
    };

    const { data, loading, error, reFetch, fetch } = useFetch(reportEndpoints[reportType], { debounceTime: 500, autoFetch: true });

    if (!user || user.role !== "admin") {
        navigate("/login");
        return null;
    }

    const handleManualFetch = () => {
        fetch(); // Manuel veri yenileme
    };

    return (
        <div className="reports-container">
            <Navbar />
            <div className="reports-content">
                <div className="report-header">
                    <h2>{reportTitles[reportType]}</h2>
                    <button className="refresh-btn" onClick={handleManualFetch}>
                        Verileri Yenile
                    </button>
                </div>
                <div className="report-display">
                    {loading && <p>Yükleniyor...</p>}
                    {error && (
                        <p className="error-message">
                            {error.response?.data?.message || error.message || "Bir hata oluştu!"}
                        </p>
                    )}
                    {data && (
                        <div className="report-data">
                            {reportType === "tasks" && (
                                <>
                                    <p>Tamamlanan Görevler: <span>{data.completed || 0}</span></p>
                                    <p>Bekleyen Görevler: <span>{data.pending || 0}</span></p>
                                </>
                            )}
                            {reportType === "users" && (
                                <>
                                    <p>Aktif Kullanıcılar: <span>{data.activeUsers || 0}</span></p>
                                    <p>Toplam Aktivite: <span>{data.totalActivity || 0}</span></p>
                                </>
                            )}
                            {reportType === "customer-status" && (
                                <>
                                    <p>Potansiyel: <span>{data.potential || 0}</span></p>
                                    <p>Keşif Bekleyen: <span>{data.discoveryPending || 0}</span></p>
                                    <p>Olumsuz: <span>{data.negative || 0}</span></p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
