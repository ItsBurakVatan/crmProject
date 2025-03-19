import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import useFetch from "../useFetch";
import api from "../api";
import "../styles/userManagement.css";

const UserManagement = () => {
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const { data, loading, error: fetchError, reFetch } = useFetch(`/users?page=${page}&limit=10`);

    useEffect(() => {
        if (data) {
            setTotalPages(data.pages || 1);
            setError(fetchError ? fetchError.message : null);
        } else if (fetchError) {
            setError("Kullanıcılar yüklenemedi: " + (fetchError.message || "Yetkisiz erişim!"));
        }
    }, [data, fetchError]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            reFetch(); // Listeyi yenile
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Rol güncellenemedi!");
        }
    };

    return (
        <div className="user-management-container">
            <Navbar />
            <div className="user-management-content">
                <h2>Kullanıcı Yönetimi</h2>
                {error && <div className="error-message">{error}</div>}
                <div className="table-wrapper">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Kullanıcı Adı</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4">Yükleniyor...</td></tr>
                            ) : data && data.data && data.data.length > 0 ? (
                                data.data.map((user) => (
                                    <tr key={user._id}>
                                        <td data-label="Kullanıcı Adı">{user.username}</td>
                                        <td data-label="Email">{user.email}</td>
                                        <td data-label="Rol">{user.role}</td>
                                        <td data-label="İşlem">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="manager">Yönetici</option>
                                                <option value="staff">Personel</option>
                                            </select>
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
        </div>
    );
};

export default UserManagement;
