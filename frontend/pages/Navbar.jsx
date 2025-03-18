import { useContext } from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import "../styles/navbar.css";

const Navbar = () => {
    const navigate = useNavigate();
    const { user, dispatch } = useContext(AuthContext);

    const handleLogout = () => {
        dispatch({ type: "LOGOUT" });   
        navigate("/login");
    };

    return (
        <div className='navContainer'>
            <NavLink to="/">
                <p className='navLogo'>CRM Portal</p>
            </NavLink>

            <nav className='navbar'>
                <ul>
                    <li><NavLink to="/aday-caris">Aday Cari Kartları</NavLink></li>
                    <li><NavLink to="/tasks">Görev/Akt.</NavLink></li>
                    <li><NavLink to="/aday-cari-status">Aday Cari Durum Kanban</NavLink></li>
                    <li className="dropdown">
                        <span>Tanımlamalar</span>
                        <ul className="dropdown-menu">
                            <li><NavLink to="/definitions/customer-status">Aday Müşteri Durumu</NavLink></li>
                            <li><NavLink to="/definitions/task-types">Görev/Aktivite Türü</NavLink></li>
                            <li><NavLink to="/definitions/user-groups">İlişkili Kullanıcı Grubu</NavLink></li>
                        </ul>
                    </li>
                    {user && (
                        <li onClick={handleLogout} style={{ cursor: "pointer" }}>
                            <span>Çıkış Yap</span>
                        </li>
                    )}
                </ul>
            </nav>
        </div>
    );
};

export default Navbar;
