import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../authContext";
import "../styles/login.css";

const Login = () => {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const { dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        dispatch({ type: "LOGIN_START" });
        try {
            const res = await api.post("/users/login", credentials);
            dispatch({ type: "LOGIN_SUCCESS", payload: res.data.details });
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Giriş başarısız!");
            dispatch({ type: "LOGIN_FAILURE", payload: err.response?.data });
        }
    };

    return (
        <div className="login">
            <div className="loginCard">
                <div className="center">
                    <h1>Giriş Yap</h1>
                    <form>
                        <div className="txt_field">
                            <input type="text" name="username" onChange={handleChange} placeholder="Kullanıcı Adı" />
                        </div>
                        <div className="txt_field">
                            <input type="password" name="password" onChange={handleChange} placeholder="Şifre" />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button className="login_button" onClick={handleLogin}>Giriş Yap</button>
                        <div className="signup_link">
                            Hesabınız yok mu? <a href="/register">Kayıt Ol</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
