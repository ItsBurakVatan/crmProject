import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../authContext";
import "../styles/login.css";

function Login() {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault();
        if (!credentials.username || !credentials.password) {
            setError("Kullanıcı adı ve şifre zorunlu.");
            return;
        }
    
        dispatch({ type: "LOGIN_START" });
        setLoading(true);
    
        try {
            const res = await axios.post("http://localhost:7700/api/users/login", credentials, {
                withCredentials: true,
            });
            console.log("Giriş başarılı, Response:", res.data); // Token’ı kontrol et
            dispatch({ type: "LOGIN_SUCCESS", payload: res.data.details });
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Giriş sırasında hata oluştu.";
            console.error("Giriş hatası:", err.response?.data || err);
            setError(errorMsg);
            dispatch({ type: "LOGIN_FAILURE", payload: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            <div className="loginCard">
                <div className="center">
                    <h1>Giriş Yap</h1>
                    <form onSubmit={handleClick}>
                        <div className="txt_field">
                            <input
                                type="text"
                                placeholder="Kullanıcı Adı"
                                id="username"
                                onChange={handleChange}
                                value={credentials.username}
                            />
                        </div>
                        <div className="txt_field">
                            <input
                                type="password"
                                placeholder="Şifre"
                                id="password"
                                onChange={handleChange}
                                value={credentials.password}
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" className="login_button" disabled={loading}>
                            {loading ? "Yükleniyor..." : "Giriş Yap"}
                        </button>
                        <div className="signup_link">
                            <p>Hesabın yok mu? <Link to="/register">Kayıt Ol</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;