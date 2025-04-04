import React, { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import api from "../api";
import { AuthContext } from "../authContext";
import { useNavigate } from "react-router-dom";
import "../styles/createAdayCari.css";

const CreateAdayCari = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Form verileri için state
    const [info, setInfo] = useState({
        adayKodu: "",
        chUnvani: "",
        adres: "",
        ulke: "",
        il: "",
        ilce: "",
        sube: "",
        sorumluPersonel: "",
        yetkiliAdiSoyadi: "",
        yetkiliGorevi: "",
        yetkiliEmail: "",
        yetkiliTelefon: "",
        vergiDairesi: "",
        vergiNo: "",
        tcKimlikNo: "",
        aciklama: "",
        durumu: "",
        cariHesapGrubu: "",
        musteriHikayesi: "",
        zip: "",
    });

    // Telefon için ayrı state (alan kodu ve numara)
    const [telefonAlanKodu, setTelefonAlanKodu] = useState("+90");
    const [telefon, setTelefon] = useState("");

    // Dropdown seçenekleri için state
    const [ulkeler, setUlkeler] = useState([]);
    const [iller, setIller] = useState([]);
    const [ilceler, setIlceler] = useState([]);
    const [subeler, setSubeler] = useState([]);
    const [personeller, setPersoneller] = useState([]);
    const [durumlar, setDurumlar] = useState([]);
    const [cariHesapGruplari, setCariHesapGruplari] = useState([]);

    // Hata mesajı için state
    const [error, setError] = useState(null);

    // Dropdown verilerini çek
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [ulkeRes, subeRes, personelRes, durumRes, cariHesapGrubuRes] = await Promise.all([
                    api.get("/ulkeler"),
                    api.get("/subeler"),
                    api.get("/users?role=staff"),
                    api.get("/durumlar"),
                    api.get("/cari-hesap-gruplari"),
                ]);
                setUlkeler(ulkeRes.data);
                setSubeler(subeRes.data);
                setPersoneller(personelRes.data.data);
                setDurumlar(durumRes.data);
                setCariHesapGruplari(cariHesapGrubuRes.data);
            } catch (err) {
                setError("Seçenekler yüklenemedi: " + (err.response?.data?.message || "Bir hata oluştu."));
            }
        };
        fetchOptions();
    }, []);

    // Ülke seçildiğinde illeri çek
    useEffect(() => {
        const fetchIller = async () => {
            if (info.ulke) {
                try {
                    const res = await api.get(`/iller?ulke=${info.ulke}`);
                    setIller(res.data);
                    setInfo((prev) => ({ ...prev, il: "", ilce: "" })); // İl ve ilçe sıfırlanır
                    setIlceler([]); // İlçeler sıfırlanır
                } catch (err) {
                    setError("İller yüklenemedi: " + (err.response?.data?.message || "Bir hata oluştu."));
                }
            } else {
                setIller([]);
                setIlceler([]);
                setInfo((prev) => ({ ...prev, il: "", ilce: "" }));
            }
        };
        fetchIller();
    }, [info.ulke]);

    // İl seçildiğinde ilçeleri çek
    useEffect(() => {
        const fetchIlceler = async () => {
            if (info.il) {
                try {
                    const res = await api.get(`/ilceler?il=${info.il}`);
                    setIlceler(res.data);
                    setInfo((prev) => ({ ...prev, ilce: "" })); // İlçe sıfırlanır
                } catch (err) {
                    setError("İlçeler yüklenemedi: " + (err.response?.data?.message || "Bir hata oluştu."));
                }
            } else {
                setIlceler([]);
                setInfo((prev) => ({ ...prev, ilce: "" }));
            }
        };
        fetchIlceler();
    }, [info.il]);

    // Form input değişikliklerini yönet
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInfo((prev) => ({ ...prev, [name]: value }));
    };

    // Telefon numarası değişikliklerini yönet
    const handleTelefonChange = (e) => {
        setTelefon(e.target.value);
    };

    // Telefon alan kodu değişikliklerini yönet
    const handleTelefonAlanKoduChange = (e) => {
        setTelefonAlanKodu(e.target.value);
    };

    // Form gönderimi
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fullTelefon = `${telefonAlanKodu}${telefon}`;
            const newAdayCari = {
                adayKodu: Number(info.adayKodu) || 1,
                company: "2", // Sabit company değeri
                sube: info.sube || undefined,
                chUnvani: info.chUnvani,
                adres: info.adres || "",
                ulke: info.ulke || undefined,
                il: info.il || undefined,
                ilce: info.ilce || undefined,
                sorumluPersonel: info.sorumluPersonel || undefined,
                yetkiliAdiSoyadi: info.yetkiliAdiSoyadi || "",
                yetkiliGorevi: info.yetkiliGorevi || "",
                yetkiliEmail: info.yetkiliEmail || "",
                yetkiliTelefon: fullTelefon,
                vergiDairesi: info.vergiDairesi || "",
                vergiNo: info.vergiNo || "",
                tcKimlikNo: info.tcKimlikNo || "",
                aciklama: info.aciklama || "",
                durumu: info.durumu || undefined,
                cariHesapGrubu: info.cariHesapGrubu || undefined,
                musteriHikayesi: info.musteriHikayesi || "",
                zip: info.zip || "",
            };

            console.log("Frontend’den gönderilen veri:", newAdayCari); // Debugging

            const response = await api.post("/adaycaris", newAdayCari);
            navigate("/aday-cari-kartlari", { state: { refresh: true } });
        } catch (error) {
            setError(error.response?.data?.message || "Aday cari oluşturulamadı.");
        }
    };

    return (
        <div className="create-aday-cari">
            <Navbar />
            <div className="create-aday-cari-container">
                <h2>Yeni Aday Cari Oluştur</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="create-aday-cari-form">
                    <div className="form-group">
                        <label>Aday Kodu</label>
                        <input
                            type="number"
                            name="adayKodu"
                            value={info.adayKodu}
                            onChange={handleInputChange}
                            placeholder="Aday Kodu"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>C/H Ünvanı</label>
                        <input
                            type="text"
                            name="chUnvani"
                            value={info.chUnvani}
                            onChange={handleInputChange}
                            placeholder="C/H Ünvanı"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Adres</label>
                        <textarea
                            name="adres"
                            value={info.adres}
                            onChange={handleInputChange}
                            placeholder="Adres"
                        />
                    </div>

                    <div className="form-group">
                        <label>Ülke</label>
                        <select
                            name="ulke"
                            value={info.ulke || ""}
                            onChange={handleInputChange}
                        >
                            <option value="">Ülke Seç</option>
                            {ulkeler.map((ulke) => (
                                <option key={ulke._id} value={ulke._id}>
                                    {ulke.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>İl</label>
                        <select
                            name="il"
                            value={info.il || ""}
                            onChange={handleInputChange}
                            disabled={!info.ulke}
                        >
                            <option value="">İl Seç</option>
                            {iller.map((il) => (
                                <option key={il._id} value={il._id}>
                                    {il.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>İlçe</label>
                        <select
                            name="ilce"
                            value={info.ilce || ""}
                            onChange={handleInputChange}
                            disabled={!info.il}
                        >
                            <option value="">İlçe Seç</option>
                            {ilceler.map((ilce) => (
                                <option key={ilce._id} value={ilce._id}>
                                    {ilce.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Şube</label>
                        <select
                            name="sube"
                            value={info.sube || ""}
                            onChange={handleInputChange}
                        >
                            <option value="">Şube Seç</option>
                            {subeler.map((sube) => (
                                <option key={sube._id} value={sube._id}>
                                    {sube.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Sorumlu Personel</label>
                        <select
                            name="sorumluPersonel"
                            value={info.sorumluPersonel || ""}
                            onChange={handleInputChange}
                        >
                            <option value="">Personel Seç</option>
                            {personeller.map((personel) => (
                                <option key={personel._id} value={personel._id}>
                                    {personel.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Yetkili Adı Soyadı</label>
                        <input
                            type="text"
                            name="yetkiliAdiSoyadi"
                            value={info.yetkiliAdiSoyadi}
                            onChange={handleInputChange}
                            placeholder="Yetkili Adı Soyadı"
                        />
                    </div>

                    <div className="form-group">
                        <label>Yetkili Görevi</label>
                        <input
                            type="text"
                            name="yetkiliGorevi"
                            value={info.yetkiliGorevi}
                            onChange={handleInputChange}
                            placeholder="Yetkili Görevi"
                        />
                    </div>

                    <div className="form-group">
                        <label>Yetkili Email</label>
                        <input
                            type="email"
                            name="yetkiliEmail"
                            value={info.yetkiliEmail}
                            onChange={handleInputChange}
                            placeholder="Yetkili Email"
                        />
                    </div>

                    <div className="form-group">
                        <label>Yetkili Telefon</label>
                        <div className="telefon-input">
                            <select
                                value={telefonAlanKodu}
                                onChange={handleTelefonAlanKoduChange}
                            >
                                <option value="+90">+90 (Türkiye)</option>
                                <option value="+1">+1 (ABD)</option>
                                <option value="+44">+44 (İngiltere)</option>
                                {/* Diğer alan kodları eklenebilir */}
                            </select>
                            <input
                                type="text"
                                value={telefon}
                                onChange={handleTelefonChange}
                                placeholder="Telefon Numarası"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Vergi Dairesi</label>
                        <input
                            type="text"
                            name="vergiDairesi"
                            value={info.vergiDairesi}
                            onChange={handleInputChange}
                            placeholder="Vergi Dairesi"
                        />
                    </div>

                    <div className="form-group">
                        <label>Vergi No</label>
                        <input
                            type="text"
                            name="vergiNo"
                            value={info.vergiNo}
                            onChange={handleInputChange}
                            placeholder="Vergi No"
                        />
                    </div>

                    <div className="form-group">
                        <label>TC Kimlik No</label>
                        <input
                            type="text"
                            name="tcKimlikNo"
                            value={info.tcKimlikNo}
                            onChange={handleInputChange}
                            placeholder="TC Kimlik No"
                        />
                    </div>

                    <div className="form-group">
                        <label>Açıklama</label>
                        <textarea
                            name="aciklama"
                            value={info.aciklama}
                            onChange={handleInputChange}
                            placeholder="Açıklama"
                        />
                    </div>

                    <div className="form-group">
                        <label>Durumu</label>
                        <select
                            name="durumu"
                            value={info.durumu || ""}
                            onChange={handleInputChange}
                        >
                            <option value="">Durum Seç</option>
                            {durumlar.map((durum) => (
                                <option key={durum._id} value={durum._id}>
                                    {durum.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Cari Hesap Grubu</label>
                        <select
                            name="cariHesapGrubu"
                            value={info.cariHesapGrubu || ""}
                            onChange={handleInputChange}
                        >
                            <option value="">Cari Hesap Grubu Seç</option>
                            {cariHesapGruplari.map((grup) => (
                                <option key={grup._id} value={grup._id}>
                                    {grup.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Müşteri Hikayesi</label>
                        <textarea
                            name="musteriHikayesi"
                            value={info.musteriHikayesi}
                            onChange={handleInputChange}
                            placeholder="Müşteri Hikayesi"
                        />
                    </div>

                    <div className="form-group">
                        <label>Posta Kodu</label>
                        <input
                            type="text"
                            name="zip"
                            value={info.zip}
                            onChange={handleInputChange}
                            placeholder="Posta Kodu"
                        />
                    </div>

                    <div className="form-buttons">
                        <button type="submit" className="submit-btn">
                            Oluştur
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate("/aday-cari-kartlari")}
                        >
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAdayCari;
