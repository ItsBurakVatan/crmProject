import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../authContext";
import "../styles/register.css";

const Register = () => {
    const [user, setUser] = useState({ username: "", email: "", password: "" });
    const [errors, setErrors] = useState({});
    const { dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!user.username || user.username.length < 3) newErrors.username = "Kullanıcı adı en az 3 karakter olmalı!";
        if (!user.email || !/^\S+@\S+\.\S+$/.test(user.email)) newErrors.email = "Geçerli bir email girin!";
        if (!user.password || user.password.length < 6) newErrors.password = "Şifre en az 6 karakter olmalı!";
        return newErrors;
    };

    const handleClick = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const res = await api.post("/users/register", user);
            dispatch({ type: "LOGIN_SUCCESS", payload: res.data.details });
            navigate("/");
        } catch (err) {
            const errorDetails = err.response?.data?.details || [];
            const errorMessage = err.response?.data?.message || "Kayıt başarısız!";
            setErrors({ submit: errorMessage, ...Object.fromEntries(errorDetails.map(e => [e.field, e.message])) });
            console.log("Kayıt hatası:", err.response?.data);
        }
    };

    return (
        <div className="register">
            <div className="registerCard">
                <div className="center">
                    <h1>Kayıt Ol</h1>
                    <form>
                        <div className="txt_field">
                            <input type="text" name="username" onChange={handleChange} placeholder="Kullanıcı Adı" />
                            {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>
                        <div className="txt_field">
                            <input type="email" name="email" onChange={handleChange} placeholder="Email" />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>
                        <div className="txt_field">
                            <input type="password" name="password" onChange={handleChange} placeholder="Şifre" />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                        {errors.submit && <div className="error-message">{errors.submit}</div>}
                        <button className="login_button" onClick={handleClick}>Kayıt Ol</button>
                        <div className="signup_link">
                            Zaten hesabınız var mı? <a href="/login">Giriş Yap</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
