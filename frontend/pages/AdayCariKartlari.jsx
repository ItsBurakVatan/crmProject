import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import useFetch from "../useFetch";
import "../styles/adayCariKartlari.css";

const AdayCariKartlari = () => {
    const [adayCaris, setAdayCaris] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();

    const { data, loading: fetchLoading, error: fetchError } = useFetch(`/adaycaris/${user?._id}?page=${page}&limit=10`);

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
                const response = await fetch(`http://localhost:7700/api/adaycaris/search/${user?._id}?query=${e.target.value}`, {
                    credentials: "include",
                });
                const result = await response.json();
                setAdayCaris(result);
                setError(null);
            } catch (error) {
                setError("Arama sırasında hata oluştu: " + error.message);
            }
        } else {
            setAdayCaris(data?.data || []);
        }
    };

    return (
        <div>
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
                                    <tr key={aday._id}>
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
        </div>
    );
};

export default AdayCariKartlari;
