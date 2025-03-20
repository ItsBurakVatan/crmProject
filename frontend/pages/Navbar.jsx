import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import "../styles/navbar.css";

const Navbar = () => {
    const { user, dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch({ type: "LOGOUT" });
        navigate("/login");
    };

    return (
        <div className="navContainer">
            <h2 className="navLogo">CRM</h2>
            <input type="checkbox" id="menu-bar" className="menu-toggle" />
            <label htmlFor="menu-bar" className="icon">☰</label>
            <nav className="navbar">
                <ul>
                    <li><NavLink to="/">Ana Sayfa</NavLink></li>
                    <li><NavLink to="/aday-caris">Aday Cari Kartları</NavLink></li>
                    <li><NavLink to="/tasks">Görev/Akt.</NavLink></li>
                    <li><NavLink to="/aday-cari-status">Aday Cari Durum Kanban</NavLink></li>
                    {user && user.role === "admin" && (
                        <li className="dropdown">
                            <span>Raporlar</span>
                            <ul className="dropdown-menu">
                                <li><NavLink to="/reports/tasks">Görevler</NavLink></li>
                                <li><NavLink to="/reports/users">Aktiviteler</NavLink></li>
                                <li><NavLink to="/reports/customer-status">Müşteri Durum Özeti</NavLink></li>
                            </ul>
                        </li>
                    )}
                    {user && (user.role === "admin" || user.role === "manager") && (
                        <li className="dropdown">
                            <span>Tanımlamalar</span>
                            <ul className="dropdown-menu">
                                <li><NavLink to="/definitions/customer-status">Aday Müşteri Durumu</NavLink></li>
                                <li><NavLink to="/definitions/task-types">Görev/Aktivite Türü</NavLink></li>
                                <li><NavLink to="/definitions/user-groups">İlişkili Kullanıcı Grubu</NavLink></li>
                            </ul>
                        </li>
                    )}
                    {user && user.role === "admin" && (
                        <li><NavLink to="/user-management">Kullanıcı Yönetimi</NavLink></li>
                    )}
                    {user && (
                        <li>
                            <button className="logout-btn" onClick={handleLogout}>
                                Çıkış Yap ({user.username})
                            </button>
                        </li>
                    )}
                </ul>
            </nav>
        </div>
    );
};

export default Navbar;
