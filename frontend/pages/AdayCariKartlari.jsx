import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import useFetch from "../useFetch";
import api from "../api"; // api dosyasını ekledik
import "../styles/adayCariKartlari.css";

const AdayCariKartlari = () => {
    const [adayCaris, setAdayCaris] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [contextMenu, setContextMenu] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [editAdayCari, setEditAdayCari] = useState(null);
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();

    const { data, loading: fetchLoading, error: fetchError, reFetch } = useFetch(`/adaycaris/${user?._id}?page=${page}&limit=10`);

    useEffect(() => {
        if (data) {
            setAdayCaris(data.data || []);
            setTotalPages(data.pages || 1);
            setLoading(fetchLoading);
            setError(fetchError ? fetchError.message : null);
        } else if (fetchError) {
            setError("Veri yüklenemedi: " + (fetchError.message || "Yetkisiz erişim!"));
        }
    }, [data, fetchLoading, fetchError]);

    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value) {
            try {
                const response = await api.get(`/adaycaris/search/${user?._id}?query=${e.target.value}`);
                setAdayCaris(response.data);
                setError(null);
            } catch (error) {
                setError("Arama sırasında hata oluştu: " + error.message);
            }
        } else {
            reFetch();
        }
    };

    const handleContextMenu = (e, aday) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, aday });
    };

    const closeContextMenu = () => setContextMenu(null);

    const handleEditAdayCari = async () => {
        if (user.role === "staff") {
            setError("Bu işlem için yetkiniz yok!");
            setTimeout(() => setError(null), 3000); // 3 saniye sonra mesajı kaldır
            return;
        }
        if (!editAdayCari) return;
        try {
            const response = await api.put(`/adaycaris/${editAdayCari._id}`, editAdayCari);
            setAdayCaris(adayCaris.map(aday => aday._id === editAdayCari._id ? response.data : aday));
            setEditAdayCari(null);
            setShowPopup(false);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Aday cari kartı düzenlenemedi.");
        }
    };

    const handleDeleteAdayCari = async (id) => {
        try {
            await api.delete(`/adaycaris/${id}`);
            setAdayCaris(adayCaris.filter(aday => aday._id !== id));
            setContextMenu(null);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Aday cari kartı silinemedi.");
        }
    };

    return (
        <div onClick={closeContextMenu}>
            <Navbar />
            <div className="aday-cari-header">
                <input
                    type="text"
                    placeholder="Cari kart ara..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-bar"
                />
                <button className="add-aday-cari-btn" onClick={() => navigate("/create-aday-cari")}>
                    + Yeni Aday Cari Kartı
                </button>
            </div>
            <div className="aday-cari-container">
                {error && <div className="error-message">{error}</div>}
                <div className="table-wrapper">
                    <table className="aday-cari-table">
                        <thead>
                            <tr>
                                <th>Aday Kodu</th>
                                <th>C/H Ünvanı</th>
                                <th>Yetkili Adı Soyadı</th>
                                <th>Yetkili Görevi</th>
                                <th>Yetkili Telefon</th>
                                <th>Yetkili Email</th>
                                <th>Vergi Dairesi</th>
                                <th>Vergi No</th>
                                <th>TC Kimlik No</th>
                                <th>Durumu</th>
                                <th>Şube</th>
                                <th>Sorumlu Personel</th>
                                <th>Ülke</th>
                                <th>İl</th>
                                <th>İlçe</th>
                                <th>Adres</th>
                                <th>Açıklama</th>
                                <th>Müşteri Hikayesi</th>
                                <th>Cari Hesap Grubu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="19">Yükleniyor...</td></tr>
                            ) : adayCaris.length > 0 ? (
                                adayCaris.map((aday) => (
                                    <tr key={aday._id} onContextMenu={(e) => handleContextMenu(e, aday)}>
                                        <td data-label="Aday Kodu">{aday.adayKodu}</td>
                                        <td data-label="C/H Ünvanı">{aday.chUnvani}</td>
                                        <td data-label="Yetkili Adı Soyadı">{aday.yetkiliAdiSoyadi || "-"}</td>
                                        <td data-label="Yetkili Görevi">{aday.yetkiliGorevi || "-"}</td>
                                        <td data-label="Yetkili Telefon">{aday.yetkiliTelefon || "-"}</td>
                                        <td data-label="Yetkili Email">{aday.yetkiliEmail || "-"}</td>
                                        <td data-label="Vergi Dairesi">{aday.vergiDairesi || "-"}</td>
                                        <td data-label="Vergi No">{aday.vergiNo || "-"}</td>
                                        <td data-label="TC Kimlik No">{aday.tcKimlikNo || "-"}</td>
                                        <td data-label="Durumu">{aday.durumu?.name || "-"}</td>
                                        <td data-label="Şube">{aday.sube?.name || "-"}</td>
                                        <td data-label="Sorumlu Personel">{aday.sorumluPersonel?.name || "-"}</td>
                                        <td data-label="Ülke">{aday.ulke?.name || "-"}</td>
                                        <td data-label="İl">{aday.il?.name || "-"}</td>
                                        <td data-label="İlçe">{aday.ilce?.name || "-"}</td>
                                        <td data-label="Adres">{aday.adres || "-"}</td>
                                        <td data-label="Açıklama">{aday.aciklama || "-"}</td>
                                        <td data-label="Müşteri Hikayesi">{aday.musteriHikayesi || "-"}</td>
                                        <td data-label="Cari Hesap Grubu">{aday.cariHesapGrubu?.name || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="19">Henüz aday cari kartı yok.</td></tr>
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

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-modern">
                        <h3 className="popup-title">Aday Cari Kartı Düzenle</h3>
                        <input
                            type="text"
                            value={editAdayCari?.chUnvani || ""}
                            onChange={(e) => setEditAdayCari({ ...editAdayCari, chUnvani: e.target.value })}
                            placeholder="C/H Ünvanı"
                            className="popup-input"
                        />
                        <input
                            type="text"
                            value={editAdayCari?.yetkiliAdiSoyadi || ""}
                            onChange={(e) => setEditAdayCari({ ...editAdayCari, yetkiliAdiSoyadi: e.target.value })}
                            placeholder="Yetkili Adı Soyadı"
                            className="popup-input"
                        />
                        <input
                            type="text"
                            value={editAdayCari?.yetkiliTelefon || ""}
                            onChange={(e) => setEditAdayCari({ ...editAdayCari, yetkiliTelefon: e.target.value })}
                            placeholder="Yetkili Telefon"
                            className="popup-input"
                        />
                        <input
                            type="text"
                            value={editAdayCari?.adres || ""}
                            onChange={(e) => setEditAdayCari({ ...editAdayCari, adres: e.target.value })}
                            placeholder="Adres"
                            className="popup-input"
                        />
                        <div className="popup-buttons">
                            <button className="popup-btn popup-btn-save" onClick={handleEditAdayCari}>
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
                <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <div
                        className={`context-menu-item ${user.role === "staff" ? "disabled" : ""}`}
                        onClick={() => {
                            if (user.role !== "staff") {
                                setEditAdayCari(contextMenu.aday);
                                setShowPopup(true);
                                setContextMenu(null);
                            }
                        }}
                    >
                        Düzenle
                    </div>
                    <div
                        className={`context-menu-item delete ${user.role === "staff" ? "disabled" : ""}`}
                        onClick={() => {
                            if (user.role !== "staff") {
                                handleDeleteAdayCari(contextMenu.aday._id);
                            }
                        }}
                    >
                        Sil
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdayCariKartlari;
