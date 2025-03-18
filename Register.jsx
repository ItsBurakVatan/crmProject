import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/register.css";

function Register() {
    const navigate = useNavigate();
    const [info, setInfo] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setInfo((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!info.username || !info.email || !info.password) {
            setError("Tüm alanlar zorunlu.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post("http://localhost:7700/api/users/register", info);
            console.log("Kayıt başarılı:", res.data);
            navigate("/login");
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Kayıt sırasında hata oluştu.";
            console.error("Kayıt hatası:", err.response?.data || err);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register">
            <div className="registerCard">
                <div className="center">
                    <h1>Kayıt Ol</h1>
                    <form onSubmit={handleClick}>
                        <div className="txt_field">
                            <input
                                type="text"
                                placeholder="Kullanıcı Adı"
                                id="username"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="txt_field">
                            <input
                                type="email"
                                placeholder="Email"
                                id="email"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="txt_field">
                            <input
                                type="password"
                                placeholder="Şifre"
                                id="password"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" className="login_button" disabled={loading}>
                            {loading ? "Yükleniyor..." : "Kayıt Ol"}
                        </button>
                        <div className="signup_link">
                            <p>Hesabın var mı? <Link to="/login">Giriş Yap</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;