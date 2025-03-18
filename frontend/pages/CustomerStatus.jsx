import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar"; 
import "../styles/adayCariKartlari.css";

const CustomerStatus = () => {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [editStatus, setEditStatus] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        const fetchStatuses = async () => {
            setLoading(true);
            try {
                const response = await axios.get("http://localhost:7700/api/status");
                setStatuses(response.data);
            } catch (error) {
                console.error("Error fetching statuses:", error);
            }
            setLoading(false);
        };
        fetchStatuses();
    }, []);

    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value) {
            try {
                const response = await axios.get(`http://localhost:7700/api/status/search?query=${e.target.value}`);
                setStatuses(response.data);
            } catch (error) {
                console.error("Error searching statuses:", error);
            }
        } else {
            const response = await axios.get("http://localhost:7700/api/status");
            setStatuses(response.data);
        }
    };

    const handleAddStatus = async () => {
        if (!newStatus) return;
        try {
            const response = await axios.post("http://localhost:7700/api/status", { name: newStatus });
            setStatuses([...statuses, response.data]);
            setNewStatus("");
            setShowPopup(false);
            alert("Durum eklendi! Aday Cari Durum sayfasını yenileyerek güncel sayıları görebilirsiniz.");
        } catch (error) {
            console.error("Error adding status:", error);
        }
    };

    const handleEditStatus = async () => {
        if (!editStatus || !editStatus.name) return;
        try {
            const response = await axios.put(`http://localhost:7700/api/status/${editStatus._id}`, { name: editStatus.name });
            setStatuses(statuses.map(status => status._id === editStatus._id ? response.data : status));
            setEditStatus(null);
            setShowPopup(false);
            alert("Durum güncellendi! Aday Cari Durum sayfasını yenileyerek güncel sayıları görebilirsiniz.");
        } catch (error) {
            console.error("Error editing status:", error);
        }
    };

    const handleDeleteStatus = async (id) => {
        try {
            await axios.delete(`http://localhost:7700/api/status/${id}`);
            setStatuses(statuses.filter(status => status._id !== id));
            setContextMenu(null);
            alert("Durum silindi! Aday Cari Durum sayfasını yenileyerek güncel sayıları görebilirsiniz.");
        } catch (error) {
            console.error("Error deleting status:", error);
        }
    };

    const handleContextMenu = (e, status) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            status
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    return (
        <div onClick={closeContextMenu}>
            <Navbar />
            <div className="aday-cari-header">
                <input
                    type="text"
                    placeholder="Durum ara..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-bar"
                />
                <button
                    className="add-aday-cari-btn"
                    onClick={() => { setNewStatus(""); setEditStatus(null); setShowPopup(true); }}
                >
                    + Yeni Durum Ekle
                </button>
            </div>
            <div className="aday-cari-container">
                <div className="table-wrapper">
                    <table className="aday-cari-table">
                        <thead>
                            <tr>
                                <th>Durum Adı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td>Yükleniyor...</td></tr>
                            ) : statuses.length > 0 ? (
                                statuses.map((status) => (
                                    <tr
                                        key={status._id}
                                        onContextMenu={(e) => handleContextMenu(e, status)}
                                    >
                                        <td>{status.name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td>Henüz durum yok.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-modern">
                        <h3 className="popup-title">{editStatus ? "Durumu Düzenle" : "Yeni Durum Ekle"}</h3>
                        <input
                            type="text"
                            value={editStatus ? editStatus.name : newStatus}
                            onChange={(e) => editStatus ? setEditStatus({ ...editStatus, name: e.target.value }) : setNewStatus(e.target.value)}
                            placeholder="Durum adı girin"
                            className="popup-input"
                        />
                        <div className="popup-buttons">
                            <button className="popup-btn popup-btn-save" onClick={editStatus ? handleEditStatus : handleAddStatus}>
                                Kaydet
                            </button>
                            <button className="popup-btn popup-btn-cancel" onClick={() => setShowPopup(false)}>
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <div
                        className="context-menu-item"
                        onClick={() => { setEditStatus(contextMenu.status); setShowPopup(true); setContextMenu(null); }}
                    >
                        Düzenle
                    </div>
                    <div
                        className="context-menu-item delete"
                        onClick={() => handleDeleteStatus(contextMenu.status._id)}
                    >
                        Sil
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerStatus;
