import React, { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import api from "../api";
import { AuthContext } from "../authContext";
import { useNavigate } from "react-router-dom";
import useFetch from "../useFetch";
import "../styles/adayCariKartlari.css";
import debounce from "lodash/debounce";

const AdayCariKartlari = () => {
    const [adayCaris, setAdayCaris] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [editAdayCari, setEditAdayCari] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchUrl = `/adaycaris/2?page=${page}&limit=10${searchQuery ? `&search=${searchQuery}` : ""}`;
    const { data, loading: fetchLoading, error: fetchError, reFetch, fetch } = useFetch(fetchUrl, { debounceTime: 500, autoFetch: true });

    useEffect(() => {
        if (data) {
            console.log("Backend’den gelen veri:", data);
            setAdayCaris(data.data || []);
            setTotalPages(data.pages || 1);
            setLoading(fetchLoading);
            setError(fetchError ? fetchError.message : null);
        } else if (fetchError) {
            setError("Aday cariler yüklenemedi: " + (fetchError.message || "Yetkisiz erişim!"));
        }
    }, [data, fetchLoading, fetchError]);

    // Periyodik polling için useEffect
    useEffect(() => {
        const interval = setInterval(() => {
            reFetch(); // Her 30 saniyede bir veriyi yenile
        }, 30000); // 30 saniye

        return () => clearInterval(interval); // Komponent unmount olduğunda interval’i temizle
    }, [reFetch]);

    const debouncedSearch = debounce(async (query) => {
        if (query) {
            try {
                const response = await api.get(`/adaycaris/2/search?query=${query}&page=${page}&limit=10`);
                setAdayCaris(response.data.data);
                setTotalPages(response.data.pages);
                setError(null);
            } catch (error) {
                setError(error.response?.data?.message || "Arama sırasında hata oluştu.");
            }
        } else {
            reFetch();
        }
    }, 300);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
        debouncedSearch(e.target.value);
    };

    const handleManualFetch = () => {
        fetch();
    };

    const handleEditAdayCari = async () => {
        if (user.role === "staff") {
            setError("Bu işlem için yetkiniz yok!");
            setTimeout(() => setError(null), 3000);
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
            const errorMessage = error.response?.data?.message || "Aday cari kartı düzenlenemedi.";
            const errorDetails = error.response?.data?.details?.length > 0 
                ? `: ${error.response.data.details.map(d => d.message).join(", ")}` 
                : "";
            setError(`${errorMessage}${errorDetails}`);
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleDeleteAdayCari = async (id) => {
        try {
            await api.delete(`/adaycaris/${id}`);
            setAdayCaris(adayCaris.filter(aday => aday._id !== id));
            setContextMenu(null);
            setError(null);
            reFetch();
        } catch (error) {
            setError(error.response?.data?.message || "Aday cari silinemedi.");
        }
    };

    const handleContextMenu = (e, adayCari) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, adayCari });
    };

    const closeContextMenu = () => setContextMenu(null);

    return (
        <div onClick={closeContextMenu}>
            <Navbar />
            <div className="aday-cari-header">
                <input
                    type="text"
                    placeholder="Aday cari ara..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-bar"
                />
                <div>
                    <button className="add-aday-cari-btn" onClick={() => navigate("/create-aday-cari")}>
                        + Yeni Aday Cari Ekle
                    </button>
                    <button className="refresh-btn" onClick={handleManualFetch}>
                        Verileri Yenile
                    </button>
                </div>
            </div>
            <div className="aday-cari-container">
                {error && <div className="error-message">{error}</div>}
                <div className="table-wrapper">
                    <table className="aday-cari-table">
                    <thead>
                        <tr>
                            <th>Aday Kodu</th><th>C/H Ünvanı</th><th>Yetkili Adı Soyadı</th><th>Yetkili Görevi</th><th>Yetkili Telefon</th>
                            <th>Yetkili Email</th><th>Vergi Dairesi</th><th>Vergi No</th><th>TC Kimlik No</th><th>Durumu</th>
                            <th>Şube</th><th>Sorumlu Personel</th><th>Ülke</th><th>İl</th><th>İlçe</th><th>Adres</th>
                            <th>Açıklama</th><th>Müşteri Hikayesi</th><th>Cari Hesap Grubu</th><th>Şehir (Rota)</th><th>Posta Kodu (Rota)</th>
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
                                    <td data-label="Adres">{aday.adres || "-"}</td>
                                    <td data-label="Ülke">{aday.ulke?.name || "-"}</td>
                                    <td data-label="İl">{aday.il?.name || "-"}</td>
                                    <td data-label="İlçe">{aday.ilce?.name || "-"}</td>
                                    <td data-label="Şube">{aday.sube?.name || "-"}</td>
                                    <td data-label="Sorumlu Personel">{aday.sorumluPersonel?.username || "-"}</td>
                                    <td data-label="Yetkili Adı Soyadı">{aday.yetkiliAdiSoyadi || "-"}</td>
                                    <td data-label="Yetkili Görevi">{aday.yetkiliGorevi || "-"}</td>
                                    <td data-label="Yetkili Email">{aday.yetkiliEmail || "-"}</td>
                                    <td data-label="Yetkili Telefon">{aday.yetkiliTelefon || "-"}</td>
                                    <td data-label="Vergi Dairesi">{aday.vergiDairesi || "-"}</td>
                                    <td data-label="Vergi No">{aday.vergiNo || "-"}</td>
                                    <td data-label="TC Kimlik No">{aday.tcKimlikNo || "-"}</td>
                                    <td data-label="Açıklama">{aday.aciklama || "-"}</td>
                                    <td data-label="Durumu">{aday.durumu?.name || "-"}</td>
                                    <td data-label="Cari Hesap Grubu">{aday.cariHesapGrubu?.name || "-"}</td>
                                    <td data-label="Müşteri Hikayesi">{aday.musteriHikayesi || "-"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="19">Henüz aday cari yok.</td></tr>
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
                        <h3 className="popup-title">Aday Cari Düzenle</h3>
                        <input
                            type="text"
                            value={editAdayCari?.chUnvani || ""}
                            onChange={(e) => setEditAdayCari({ ...editAdayCari, chUnvani: e.target.value })}
                            placeholder="C/H Ünvanı"
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
                                setEditAdayCari(contextMenu.adayCari);
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
                                handleDeleteAdayCari(contextMenu.adayCari._id);
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
