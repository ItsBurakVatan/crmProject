import React, { useState, useEffect, useContext } from "react";
import Navbar from './Navbar';
import api from "../api";
import { AuthContext } from "../authContext";
import "../styles/createAdayCari.css";
import { useNavigate } from "react-router-dom";

const CreateAdayCari = () => {
    const [info, setInfo] = useState({ adayKodu: 1 });
    const [popup, setPopup] = useState({ show: false, message: "", isError: false });
    const [branchs, setBranchs] = useState([]);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [towns, setTowns] = useState([]);
    const [staff, setStaff] = useState([]);
    const [groups, setGroups] = useState([]);
    const [status, setStatus] = useState([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            console.log("Kullanıcı giriş yapmamış, yönlendiriliyor...");
            navigate("/login");
            return;
        }

        const fetchInitialData = async () => {
            console.log("Fetching initial data for CreateAdayCari, User:", user);
            try {
                const [adayRes, branchRes, countryRes, staffRes, groupRes, statusRes] = await Promise.all([
                    api.get(`/adaycaris/${user._id}`), // getAdayCaris endpoint’i
                    api.get("/adaycaris/branchs"),
                    api.get("/adaycaris/countries"),
                    api.get("/adaycaris/staff"),
                    api.get("/adaycaris/groups"),
                    api.get("/adaycaris/status"),
                ]);
                console.log("Aday Response:", adayRes.data); // Tam yanıtı kontrol et
                console.log("Branchs:", branchRes.data);
                console.log("Countries:", countryRes.data);
                console.log("Staff:", staffRes.data);
                console.log("Groups:", groupRes.data);
                console.log("Status:", statusRes.data);

                // getAdayCaris’in döndürdüğü yapıdan `data` alanını al
                const adayCaris = adayRes.data.data || []; // data yoksa boş dizi
                const lastAday = adayCaris.length > 0 ? adayCaris.sort((a, b) => b.adayKodu - a.adayKodu)[0] : null;
                setInfo((prev) => ({ ...prev, adayKodu: lastAday ? lastAday.adayKodu + 1 : 1 }));
                setBranchs(branchRes.data);
                setCountries(countryRes.data);
                setStaff(staffRes.data);
                setGroups(groupRes.data);
                setStatus(statusRes.data);
            } catch (err) {
                console.error("Error fetching initial data:", err.response ? err.response.data : err.message);
            }
        };
        fetchInitialData();
    }, [user, navigate]);

    const handleChange = (e) => {
        setInfo((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleCountryChange = async (e) => {
        const countryId = e.target.value;
        setInfo((prev) => ({ ...prev, ulke: countryId, il: "", ilce: "" }));
        try {
            const res = await api.get(`/adaycaris/cities/${countryId}`);
            console.log("Cities Response:", res.data);
            setCities(res.data);
            setTowns([]);
        } catch (err) {
            console.error("Error fetching cities:", err.response ? err.response.data : err.message);
        }
    };

    const handleCityChange = async (e) => {
        const cityId = e.target.value;
        const selectedCity = cities.find(city => city._id === cityId);
        setInfo((prev) => ({ ...prev, il: cityId, ilce: "" }));
        try {
            const plate = selectedCity.plate || "";
            const res = await api.get(`/adaycaris/towns/${plate}`);
            console.log("Towns Response:", res.data);
            setTowns(res.data);
        } catch (err) {
            console.error("Error fetching towns:", err.response ? err.response.data : err.message);
            setTowns([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullTelefon = `${info.telefonKodu || "+90"}${info.yetkiliTelefon || ""}`;
        const newAdayCari = { 
            ...info, 
            sube: info.sube || null,
            chUnvani: info.chUnvani || "",
            adres: info.adres || "",
            ulke: info.ulke || null,
            il: info.il || null,
            ilce: info.ilce || null,
            sorumluPersonel: info.sorumluPersonel || null,
            yetkiliAdiSoyadi: info.yetkiliAdiSoyadi || "",
            yetkiliGorevi: info.yetkiliGorevi || "",
            yetkiliEmail: info.yetkiliEmail || "",
            yetkiliTelefon: fullTelefon,
            vergiDairesi: info.vergiDairesi || "",
            vergiNo: info.vergiNo || "",
            tcKimlikNo: info.tcKimlikNo || "",
            aciklama: info.aciklama || "",
            durumu: info.durumu || null,
            cariHesapGrubu: info.cariHesapGrubu || null,
            musteriHikayesi: info.musteriHikayesi || "",
            company: user._id,
        };
    
        try {
            await api.post("/adaycaris", newAdayCari);
            setPopup({ show: true, message: "Aday cari başarıyla eklendi!", isError: false });
            setTimeout(() => {
                setPopup({ show: false, message: "", isError: false });
                navigate('/aday-caris');
            }, 2000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Bir hata oluştu!";
            setPopup({ show: true, message: errorMessage, isError: true });
            setTimeout(() => setPopup({ show: false, message: "", isError: false }), 3000);
        }
    };

    // JSX kısmı değişmedi, aynı kalabilir...
    return (
        <div className="create-aday-cari-container">
            <Navbar />
            <div className="form-container">
                <h2>Aday Cari Ekle</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Şube</label>
                        <select id="sube" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {branchs.map((branch) => (
                                <option key={branch._id} value={branch._id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Aday Kodu</label>
                        <input type="number" id="adayKodu" value={info.adayKodu} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label>C/H Ünvanı</label>
                        <input type="text" id="chUnvani" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Adres</label>
                        <textarea id="adres" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Ülke</label>
                        <select id="ulke" onChange={handleCountryChange}>
                            <option value="">Seçiniz</option>
                            {countries.map((country) => (
                                <option key={country._id} value={country._id}>{country.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>İl</label>
                        <select id="il" onChange={handleCityChange} disabled={!info.ulke}>
                            <option value="">Seçiniz</option>
                            {cities.map((city) => (
                                <option key={city._id} value={city._id}>{city.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>İlçe</label>
                        <select id="ilce" onChange={handleChange} disabled={!info.il}>
                            <option value="">Seçiniz</option>
                            {towns.map((town) => (
                                <option key={town._id} value={town._id}>{town.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Sorumlu Personel</label>
                        <select id="sorumluPersonel" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {staff.map((person) => (
                                <option key={person._id} value={person._id}>{person.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Yetkili Adı Soyadı</label>
                        <input type="text" id="yetkiliAdiSoyadi" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Yetkili Görevi</label>
                        <input type="text" id="yetkiliGorevi" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Yetkili Email</label>
                        <input type="email" id="yetkiliEmail" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Yetkili Telefon</label>
                        <select id="telefonKodu" onChange={handleChange} style={{ width: "100px" }}>
                            <option value="+90">+90</option>
                            <option value="+49">+49</option>
                        </select>
                        <input
                            type="text"
                            id="yetkiliTelefon"
                            onChange={handleChange}
                            placeholder="Telefon numarası"
                            style={{ width: "calc(100% - 110px)", marginLeft: "10px" }}
                        />
                    </div>
                    <div className="input-group">
                        <label>Vergi Dairesi</label>
                        <input type="text" id="vergiDairesi" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Vergi No</label>
                        <input type="text" id="vergiNo" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>TC Kimlik No</label>
                        <input type="text" id="tcKimlikNo" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Açıklama</label>
                        <textarea id="aciklama" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Durumu</label>
                        <select id="durumu" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {status.map((stat) => (
                                <option key={stat._id} value={stat._id}>{stat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Cari Hesap Grubu</label>
                        <select id="cariHesapGrubu" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {groups.map((group) => (
                                <option key={group._id} value={group._id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Müşteri Hikayesi</label>
                        <textarea id="musteriHikayesi" onChange={handleChange} />
                    </div>
                    <div className="button-group">
                        <button type="submit" className="save-btn">Kaydet</button>
                        <button type="button" className="cancel-btn" onClick={() => navigate('/aday-caris')}>
                            Vazgeç
                        </button>
                    </div>
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
