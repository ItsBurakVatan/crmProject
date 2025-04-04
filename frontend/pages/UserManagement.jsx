import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import api from "../api";
import useFetch from "../useFetch";
import "../styles/userManagement.css";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [contextMenu, setContextMenu] = useState(null);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    const fetchUrl = `/users?page=${page}&limit=10${searchQuery ? `&search=${searchQuery}` : ""}${roleFilter ? `&role=${roleFilter}` : ""}`;
    const { data, loading: fetchLoading, error: fetchError, reFetch, fetch } = useFetch(fetchUrl, { debounceTime: 500, autoFetch: true });

    useEffect(() => {
        if (data) {
            setUsers(data.data || []);
            setTotalPages(data.pages || 1);
            setLoading(fetchLoading);
            setError(fetchError ? fetchError.message : null);
        } else if (fetchError) {
            setError("Kullanıcılar yüklenemedi: " + (fetchError.message || "Yetkisiz erişim!"));
        }
    }, [data, fetchLoading, fetchError]);

    const handleManualFetch = () => {
        fetch(); // Manuel veri yenileme
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await api.put(`/users/${id}`, { role: newRole });
            setUsers(users.map(user => (user._id === id ? { ...user, role: newRole } : user)));
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Rol güncellenemedi.");
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            reFetch();
            setContextMenu(null);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Kullanıcı silinemedi.");
        }
    };

    const handleShowDetails = async (userId) => {
        try {
            const response = await api.get(`/users/${userId}/details`);
            setSelectedUser(response.data);
            setShowDetailsPopup(true);
            setContextMenu(null);
        } catch (error) {
            setError("Kullanıcı detayları alınamadı.");
        }
    };

    const handleToggleActive = async (id, isActive) => {
        try {
            await api.put(`/users/${id}/toggle-active`, { isActive });
            reFetch();
            setMessage(isActive ? "Kullanıcı aktife döndü" : "Kullanıcı pasife döndü");
            setTimeout(() => setMessage(null), 3000);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Durum güncellenemedi.");
        }
    };

    const handleContextMenu = (e, user) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, user });
    };

    const closeContextMenu = () => setContextMenu(null);

    return (
        <div onClick={closeContextMenu}>
            <Navbar />
            <div className="user-management-container">
                <div className="user-management-content">
                    <div className="user-management-header">
                        <h2>Kullanıcı Yönetimi</h2>
                        <div className="user-management-filters">
                            <input
                                type="text"
                                placeholder="Kullanıcı ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-bar"
                            />
                            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="role-filter">
                                <option value="">Tüm Roller</option>
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button className="refresh-btn" onClick={handleManualFetch}>
                                Verileri Yenile
                            </button>
                        </div>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    {message && <div className="success-message">{message}</div>}
                    <div className="table-wrapper">
                        <table className="user-table">
                            <thead>
                                <tr>
                                    <th>Kullanıcı Adı</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4">Yükleniyor...</td></tr>
                                ) : users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user._id} onContextMenu={(e) => handleContextMenu(e, user)}>
                                            <td data-label="Kullanıcı Adı">{user.username}</td>
                                            <td data-label="Email">{user.email}</td>
                                            <td data-label="Rol">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                >
                                                    <option value="staff">Staff</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td data-label="Durum">
                                                <input
                                                    type="checkbox"
                                                    checked={user.isActive === true}
                                                    onChange={() => handleToggleActive(user._id, user.isActive === true ? false : true)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4">Henüz kullanıcı yok.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination">
                        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Önceki</button>
                        <span>Sayfa {page} / {totalPages}</span>
                        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Sonraki</button>
                    </div>
                </div>

                {showDetailsPopup && (
                    <div className="popup-overlay">
                        <div className="popup-modern">
                            <h3>{selectedUser.username} Detayları</h3>
                            <p>Email: {selectedUser.email}</p>
                            <p>Rol: {selectedUser.role}</p>
                            <p>Oluşturduğu Görev Sayısı: {selectedUser.taskCount !== undefined ? selectedUser.taskCount : "Bilinmiyor"}</p>
                            <p>Oluşturduğu Aktivite Sayısı: {selectedUser.activityCount !== undefined ? selectedUser.activityCount : "Bilinmiyor"}</p>
                            <p>Oluşturduğu Aday Cari Sayısı: {selectedUser.adayCariCount !== undefined ? selectedUser.adayCariCount : "Bilinmiyor"}</p>
                            <button className="popup-btn popup-btn-cancel" onClick={() => setShowDetailsPopup(false)}>
                                Kapat
                            </button>
                        </div>
                    </div>
                )}

                {contextMenu && (
                    <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <div className="context-menu-item" onClick={() => handleShowDetails(contextMenu.user._id)}>
                            Detaylar
                        </div>
                        <div className="context-menu-item delete" onClick={() => handleDeleteUser(contextMenu.user._id)}>
                            Sil
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
