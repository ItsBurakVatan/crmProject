import React, { useState, useEffect, useContext } from "react";
import Navbar from './Navbar';
import api from "../api";
import { AuthContext } from "../authContext";
import "../styles/createAdayCari.css";
import { useNavigate } from "react-router-dom";

const CreateAdayCari = () => {
    const [info, setInfo] = useState({ 
        adayKodu: 1, 
        role: "", 
        chUnvani: "", 
        adres: "", 
        ulke: "", 
        il: "", 
        ilce: "", 
        yetkiliAdiSoyadi: "", 
        yetkiliGorevi: "", 
        yetkiliEmail: "", 
        yetkiliTelefon: "", 
        telefonKodu: "+90", 
        vergiDairesi: "", 
        vergiNo: "", 
        tcKimlikNo: "", 
        aciklama: "", 
        sube: "", 
        sorumluPersonel: "", 
        durumu: "", 
        cariHesapGrubu: "", 
        musteriHikayesi: "",
        zip: "",
    });
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [popup, setPopup] = useState({ show: false, message: "", isError: false });
    const [staff, setStaff] = useState([]);
    const [groups, setGroups] = useState([]);
    const [status, setStatus] = useState([]);
    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [towns, setTowns] = useState([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchInitialData = async () => {
            try {
                const [adayRes, staffRes, groupRes, statusRes, rolesRes, branchRes, countryRes] = await Promise.all([
                    api.get(`/adaycaris/${user._id}`).catch(err => ({ data: { data: [] } })),
                    api.get("/adaycaris/staff"),
                    api.get("/adaycaris/groups"),
                    api.get("/adaycaris/status"),
                    api.get("/roles"),
                    api.get("/adaycaris/branchs"),
                    api.get("/adaycaris/countries"),
                ]);
                const adayCaris = adayRes.data.data || [];
                const lastAday = adayCaris.length > 0 ? adayCaris.sort((a, b) => b.adayKodu - a.adayKodu)[0] : null;
                setInfo((prev) => ({ ...prev, adayKodu: lastAday ? lastAday.adayKodu + 1 : 1 }));
                setStaff(staffRes.data || []);
                setGroups(groupRes.data || []);
                setStatus(statusRes.data || []);
                setRoles(rolesRes.data || []);
                setBranches(branchRes.data || []);
                setCountries(countryRes.data || []);
            } catch (err) {
                console.error("Error fetching initial data:", err.response ? err.response.data : err.message);
            }
        };
        fetchInitialData();
    }, [user, navigate]);

    useEffect(() => {
        if (info.ulke) {
            const fetchCities = async () => {
                try {
                    const cityRes = await api.get(`/adaycaris/cities/${info.ulke}`);
                    setCities(cityRes.data);
                    setInfo((prev) => ({ ...prev, il: "", ilce: "" }));
                    setTowns([]);
                } catch (err) {
                    console.error("Error fetching cities:", err.message);
                }
            };
            fetchCities();
        }
    }, [info.ulke]);

    useEffect(() => {
        if (info.il) {
            const fetchTowns = async () => {
                try {
                    const selectedCity = cities.find(city => city._id === info.il);
                    const plate = selectedCity ? selectedCity.plate : info.il;
                    console.log("Fetching towns for plate:", plate);
                    const townRes = await api.get(`/adaycaris/towns/${plate}`);
                    console.log("Fetched towns:", townRes.data);
                    setTowns(townRes.data || []);
                    setInfo((prev) => ({ ...prev, ilce: "" }));
                } catch (err) {
                    console.error("Error fetching towns:", err.response ? err.response.data : err.message);
                    setTowns([]);
                    setGeneralError("İlçeler alınamadı, lütfen tekrar deneyin.");
                }
            };
            fetchTowns();
        } else {
            setTowns([]);
        }
    }, [info.il, cities]);

    const handleChange = (e) => {
        setInfo((prev) => ({ ...prev, [e.target.id]: e.target.value }));
        setErrors((prev) => ({ ...prev, [e.target.id]: "" }));
        setGeneralError("");
    };

    const validateForm = () => {
        const newErrors = {};
        if (!info.chUnvani) newErrors.chUnvani = "Bu alanı doldurmak zorunlu!";
        if (info.yetkiliEmail && !/^\S+@\S+\.\S+$/.test(info.yetkiliEmail)) newErrors.yetkiliEmail = "Geçerli bir email adresi girin!";
        if (info.vergiNo && !/^\d{8,15}$/.test(info.vergiNo)) newErrors.vergiNo = "Vergi numarası 8-15 haneli olmalı!";
        if (info.tcKimlikNo && !/^\d{11}$/.test(info.tcKimlikNo)) newErrors.tcKimlikNo = "TC Kimlik No 11 haneli olmalı!";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setGeneralError("");

        const clientErrors = validateForm();
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            setGeneralError("Lütfen yukarıdaki zorunlu alanları doldurun veya hataları düzeltin.");
            return;
        }

        const telefonKodu = info.telefonKodu || "+90";
        const yetkiliTelefonRaw = info.yetkiliTelefon || "";
        const fullTelefon = yetkiliTelefonRaw ? `${telefonKodu}${yetkiliTelefonRaw}` : undefined;

        const newAdayCari = {
            adayKodu: Number(info.adayKodu) || 1,
            company: user._id,
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

        try {
            const response = await api.post("/adaycaris", newAdayCari);
            const synced = response.data.synced;
            setPopup({ 
                show: true, 
                message: synced 
                    ? "Aday cari başarıyla eklendi ve Rota Cloud ile senkronize edildi!" 
                    : "Aday cari eklendi, ancak Rota Cloud senkronizasyonu başarısız!",
                isError: !synced 
            });
            setTimeout(() => {
                setPopup({ show: false, message: "", isError: false });
                navigate('/aday-caris');
            }, 2000);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Bir hata oluştu!";
            setGeneralError(errorMessage);
            setPopup({ show: true, message: errorMessage, isError: true });
            setTimeout(() => setPopup({ show: false, message: "", isError: false }), 3000);
        }
    };

    return (
        <div className="create-aday-cari-container">
            <Navbar />
            <div className="form-container">
                <h2>Aday Cari Ekle</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Şube</label>
                        <select id="sube" value={info.sube} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {branches.map((branch) => (
                                <option key={branch._id} value={branch._id}>{branch.name}</option>
                            ))}
                        </select>
                        {errors.sube && <span className="error">{errors.sube}</span>}
                    </div>
                    <div className="input-group">
                        <label>Aday Kodu</label>
                        <input type="number" id="adayKodu" value={info.adayKodu} onChange={handleChange} required />
                        {errors.adayKodu && <span className="error">{errors.adayKodu}</span>}
                    </div>
                    <div className="input-group">
                        <label>C/H Ünvanı</label>
                        <input type="text" id="chUnvani" value={info.chUnvani} onChange={handleChange} />
                        {errors.chUnvani && <span className="error">{errors.chUnvani}</span>}
                    </div>
                    <div className="input-group">
                        <label>Adres</label>
                        <textarea id="adres" value={info.adres} onChange={handleChange} />
                        {errors.adres && <span className="error">{errors.adres}</span>}
                    </div>
                    <div className="input-group">
                        <label>Ülke</label>
                        <select id="ulke" value={info.ulke} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {countries.map((country) => (
                                <option key={country._id} value={country._id}>{country.name}</option>
                            ))}
                        </select>
                        {errors.ulke && <span className="error">{errors.ulke}</span>}
                    </div>
                    <div className="input-group">
                        <label>İl</label>
                        <select id="il" value={info.il} onChange={handleChange} disabled={!info.ulke}>
                            <option value="">Seçiniz</option>
                            {cities.map((city) => (
                                <option key={city._id} value={city._id}>{city.name}</option>
                            ))}
                        </select>
                        {errors.il && <span className="error">{errors.il}</span>}
                    </div>
                    <div className="input-group">
                        <label>İlçe</label>
                        <select id="ilce" value={info.ilce} onChange={handleChange} disabled={!info.il}>
                            <option value="">Seçiniz</option>
                            {towns.map((town) => (
                                <option key={town._id} value={town._id}>{town.name}</option>
                            ))}
                        </select>
                        {errors.ilce && <span className="error">{errors.ilce}</span>}
                    </div>
                    <div className="input-group">
                        <label>Posta Kodu</label>
                        <input type="text" id="zip" value={info.zip} onChange={handleChange} />
                        {errors.zip && <span className="error">{errors.zip}</span>}
                    </div>
                    <div className="input-group">
                        <label>Sorumlu Personel</label>
                        <select id="sorumluPersonel" value={info.sorumluPersonel} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {staff.map((person) => (
                                <option key={person._id} value={person._id}>{person.name}</option>
                            ))}
                        </select>
                        {errors.sorumluPersonel && <span className="error">{errors.sorumluPersonel}</span>}
                    </div>
                    <div className="input-group">
                        <label>Yetkili Adı Soyadı</label>
                        <input type="text" id="yetkiliAdiSoyadi" value={info.yetkiliAdiSoyadi} onChange={handleChange} />
                        {errors.yetkiliAdiSoyadi && <span className="error">{errors.yetkiliAdiSoyadi}</span>}
                    </div>
                    <div className="input-group">
                        <label>Yetkili Görevi</label>
                        <input type="text" id="yetkiliGorevi" value={info.yetkiliGorevi} onChange={handleChange} />
                        {errors.yetkiliGorevi && <span className="error">{errors.yetkiliGorevi}</span>}
                    </div>
                    <div className="input-group">
                        <label>Yetkili Email</label>
                        <input type="email" id="yetkiliEmail" value={info.yetkiliEmail} onChange={handleChange} />
                        {errors.yetkiliEmail && <span className="error">{errors.yetkiliEmail}</span>}
                    </div>
                    <div className="input-group">
                        <label>Yetkili Telefon</label>
                        <select id="telefonKodu" value={info.telefonKodu} onChange={handleChange} style={{ width: "100px" }}>
                            <option value="+90">+90</option>
                            <option value="+49">+49</option>
                        </select>
                        <input
                            type="text"
                            id="yetkiliTelefon"
                            value={info.yetkiliTelefon}
                            onChange={handleChange}
                            placeholder="Telefon numarası"
                            style={{ width: "calc(100% - 110px)", marginLeft: "10px" }}
                        />
                        {errors.yetkiliTelefon && <span className="error">{errors.yetkiliTelefon}</span>}
                    </div>
                    <div className="input-group">
                        <label>Vergi Dairesi</label>
                        <input type="text" id="vergiDairesi" value={info.vergiDairesi} onChange={handleChange} />
                        {errors.vergiDairesi && <span className="error">{errors.vergiDairesi}</span>}
                    </div>
                    <div className="input-group">
                        <label>Vergi No</label>
                        <input type="text" id="vergiNo" value={info.vergiNo} onChange={handleChange} />
                        {errors.vergiNo && <span className="error">{errors.vergiNo}</span>}
                    </div>
                    <div className="input-group">
                        <label>TC Kimlik No</label>
                        <input type="text" id="tcKimlikNo" value={info.tcKimlikNo} onChange={handleChange} />
                        {errors.tcKimlikNo && <span className="error">{errors.tcKimlikNo}</span>}
                    </div>
                    <div className="input-group">
                        <label>Açıklama</label>
                        <textarea id="aciklama" value={info.aciklama} onChange={handleChange} />
                        {errors.aciklama && <span className="error">{errors.aciklama}</span>}
                    </div>
                    <div className="input-group">
                        <label>Durumu</label>
                        <select id="durumu" value={info.durumu} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {status.map((stat) => (
                                <option key={stat._id} value={stat._id}>{stat.name}</option>
                            ))}
                        </select>
                        {errors.durumu && <span className="error">{errors.durumu}</span>}
                    </div>
                    <div className="input-group">
                        <label>Cari Hesap Grubu</label>
                        <select id="cariHesapGrubu" value={info.cariHesapGrubu} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {groups.map((group) => (
                                <option key={group._id} value={group._id}>{group.name}</option>
                            ))}
                        </select>
                        {errors.cariHesapGrubu && <span className="error">{errors.cariHesapGrubu}</span>}
                    </div>
                    <div className="input-group">
                        <label>Müşteri Hikayesi</label>
                        <textarea id="musteriHikayesi" value={info.musteriHikayesi} onChange={handleChange} />
                        {errors.musteriHikayesi && <span className="error">{errors.musteriHikayesi}</span>}
                    </div>
                    <div className="button-group">
                        <button type="submit" className="save-btn">Kaydet</button>
                        <button type="button" className="cancel-btn" onClick={() => navigate('/aday-caris')}>
                            Vazgeç
                        </button>
                    </div>
                    {generalError && <div className="general-error">{generalError}</div>}
                </form>
                {popup.show && (
                    <div className={`popup ${popup.isError ? "error" : "success"}`}>
                        {popup.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateAdayCari;
