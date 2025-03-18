import React, { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import "../styles/adayCariKartlari.css";
import api from "../api";

const AdayCariKartlari = () => {
    const [adayCaris, setAdayCaris] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [editAdayCari, setEditAdayCari] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Aday Carileri Çekme (Sayfalama ile)
    useEffect(() => {
        const fetchAdayCaris = async () => {
            setLoading(true);
            console.log("Fetching aday caris for user:", user); // Kullanıcı bilgisi
            try {
                const response = await api.get(
                    `http://localhost:7700/api/adaycaris/${user._id}?page=${page}&limit=10`,
                    { withCredentials: true } // Token’ın gönderildiğinden emin ol

                );
                console.log("Aday Caris Response:", response.data); // Yanıtı kontrol et
                setAdayCaris(response.data.data);
                setTotalPages(response.data.pages);
            } catch (error) {
                console.error("Error fetching aday caris:", error.response ? error.response.data : error.message);
            }
            setLoading(false);
        };
        if (user && user._id) {
            fetchAdayCaris();
        } else {
            console.log("User ID bulunamadı!");
        }
    }, [user._id, page]);

    // Arama Fonksiyonu
    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value) {
            try {
                const response = await api.get(
                    `http://localhost:7700/api/adaycaris/search/${user._id}?query=${e.target.value}`
                );
                setAdayCaris(response.data);
                setPage(1); // Arama yapıldığında sayfayı sıfırla
                setTotalPages(1); // Arama sonucu için sayfalama geçici olarak devre dışı
            } catch (error) {
                console.error("Error searching aday caris:", error);
            }
        } else {
            const response = await api.get(
                `http://localhost:7700/api/adaycaris/${user._id}?page=${page}&limit=10`
            );
            setAdayCaris(response.data.data);
            setTotalPages(response.data.pages);
        }
    };

    // Aday Cari Düzenleme
    const handleEditAdayCari = async () => {
        if (!editAdayCari) return;
        try {
            const response = await api.put(
                `http://localhost:7700/api/adaycaris/${editAdayCari._id}`,
                editAdayCari
            );
            setAdayCaris(adayCaris.map(ad => ad._id === editAdayCari._id ? response.data : ad));
            setEditAdayCari(null);
            setShowPopup(false);
        } catch (error) {
            console.error("Error editing aday cari:", error);
        }
    };

    // Aday Cari Silme
    const handleDeleteAdayCari = async (id) => {
        try {
            await api.delete(`http://localhost:7700/api/adaycaris/${id}`);
            setAdayCaris(adayCaris.filter(ad => ad._id !== id));
            setContextMenu(null);
        } catch (error) {
            console.error("Error deleting aday cari:", error);
        }
    };

    // Context Menüsü Açma
    const handleContextMenu = (e, aday) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            aday
        });
    };

    // Context Menüsü Kapama
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
                <button
                    className="add-aday-cari-btn"
                    onClick={() => navigate("/create-aday-cari")}
                >
                    + Aday Cari Ekle
                </button>
            </div>
            <div className="aday-cari-container">
                <div className="table-wrapper">
                    <table className="aday-cari-table">
                        <thead>
                            <tr>
                                <th>Aday Kodu</th>
                                <th>C/H Ünvanı</th>
                                <th>Adres</th>
                                <th>Ülke</th>
                                <th>İl</th>
                                <th>İlçe</th>
                                <th>Şube</th>
                                <th>Sorumlu Personel</th>
                                <th>Yetkili Adı Soyadı</th>
                                <th>Yetkili Görevi</th>
                                <th>Yetkili Email</th>
                                <th>Yetkili Telefon</th>
                                <th>Vergi Dairesi</th>
                                <th>Vergi No</th>
                                <th>TC Kimlik No</th>
                                <th>Açıklama</th>
                                <th>Durumu</th>
                                <th>Cari Hesap Grubu</th>
                                <th>Müşteri Hikayesi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="19">Yükleniyor...</td></tr>
                            ) : adayCaris.length > 0 ? (
                                adayCaris.map((aday) => (
                                    <tr
                                        key={aday._id}
                                        onContextMenu={(e) => handleContextMenu(e, aday)}
                                    >
                                        <td data-label="Aday Kodu">{aday.adayKodu}</td>
                                        <td data-label="C/H Ünvanı">{aday.chUnvani}</td>
                                        <td data-label="Adres">{aday.adres}</td>
                                        <td data-label="Ülke">{aday.ulke?.name || "Bilinmiyor"}</td>
                                        <td data-label="İl">{aday.il?.name || "Bilinmiyor"}</td>
                                        <td data-label="İlçe">{aday.ilce?.name || "Bilinmiyor"}</td>
                                        <td data-label="Şube">{aday.sube?.name || "Bilinmiyor"}</td>
                                        <td data-label="Sorumlu Personel">{aday.sorumluPersonel?.name || "Bilinmiyor"}</td>
                                        <td data-label="Yetkili Adı Soyadı">{aday.yetkiliAdiSoyadi}</td>
                                        <td data-label="Yetkili Görevi">{aday.yetkiliGorevi}</td>
                                        <td data-label="Yetkili Email">{aday.yetkiliEmail}</td>
                                        <td data-label="Yetkili Telefon">{aday.yetkiliTelefon}</td>
                                        <td data-label="Vergi Dairesi">{aday.vergiDairesi}</td>
                                        <td data-label="Vergi No">{aday.vergiNo}</td>
                                        <td data-label="TC Kimlik No">{aday.tcKimlikNo}</td>
                                        <td data-label="Açıklama">{aday.aciklama || "-"}</td>
                                        <td data-label="Durumu">{aday.durumu?.name || "Bilinmiyor"}</td>
                                        <td data-label="Cari Hesap Grubu">{aday.cariHesapGrubu?.name || "Bilinmiyor"}</td>
                                        <td data-label="Müşteri Hikayesi">{aday.musteriHikayesi || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="19">Henüz aday cari yok.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Sayfalama Butonları */}
                <div className="pagination">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                    >
                        Önceki
                    </button>
                    <span>Sayfa {page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                    >
                        Sonraki
                    </button>
                </div>
            </div>

            {/* Düzenleme Pop-up’ı */}
            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-modern">
                        <h3 className="popup-title">Aday Cari Düzenle</h3>
                        <input
                            type="text"
                            value={editAdayCari?.adayKodu || ""}
                            onChange={(e) => setEditAdayCari({ ...editAdayCari, adayKodu: e.target.value })}
                            placeholder="Aday Kodu"
                            className="popup-input"
                        />
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
                        <input
                            type="text"
                            value={editAdayCari?.yetkiliAdiSoyadi || ""}
                            onChange={(e) => setEditAdayCari({ ...editAdayCari, yetkiliAdiSoyadi: e.target.value })}
                            placeholder="Yetkili Adı Soyadı"
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

            {/* Context Menüsü */}
            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <div
                        className="context-menu-item"
                        onClick={() => {
                            setEditAdayCari(contextMenu.aday);
                            setShowPopup(true);
                            setContextMenu(null);
                        }}
                    >
                        Düzenle
                    </div>
                    <div
                        className="context-menu-item delete"
                        onClick={() => handleDeleteAdayCari(contextMenu.aday._id)}
                    >
                        Sil
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdayCariKartlari;
