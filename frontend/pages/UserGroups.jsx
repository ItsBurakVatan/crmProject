import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import "../styles/adayCariKartlari.css";

const UserGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [newGroup, setNewGroup] = useState("");
    const [editGroup, setEditGroup] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            setLoading(true);
            try {
                const response = await axios.get("http://localhost:7700/api/groups");
                setGroups(response.data);
            } catch (error) {
                console.error("Error fetching groups:", error);
            }
            setLoading(false);
        };
        fetchGroups();
    }, []);

    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value) {
            try {
                const response = await axios.get(`http://localhost:7700/api/groups/search?query=${e.target.value}`);
                setGroups(response.data);
            } catch (error) {
                console.error("Error searching groups:", error);
            }
        } else {
            const response = await axios.get("http://localhost:7700/api/groups");
            setGroups(response.data);
        }
    };

    const handleAddGroup = async () => {
        if (!newGroup) return;
        try {
            const response = await axios.post("http://localhost:7700/api/groups", { name: newGroup });
            setGroups([...groups, response.data]);
            setNewGroup("");
            setShowPopup(false);
        } catch (error) {
            console.error("Error adding group:", error);
        }
    };

    const handleEditGroup = async () => {
        if (!editGroup || !editGroup.name) return;
        try {
            const response = await axios.put(`http://localhost:7700/api/groups/${editGroup._id}`, { name: editGroup.name });
            setGroups(groups.map(group => group._id === editGroup._id ? response.data : group));
            setEditGroup(null);
            setShowPopup(false);
        } catch (error) {
            console.error("Error editing group:", error);
        }
    };

    const handleDeleteGroup = async (id) => {
        try {
            await axios.delete(`http://localhost:7700/api/groups/${id}`);
            setGroups(groups.filter(group => group._id !== id));
            setContextMenu(null);
        } catch (error) {
            console.error("Error deleting group:", error);
        }
    };

    const handleContextMenu = (e, group) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            group
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    return (
        <div onClick={closeContextMenu}>
            <Navbar />
            <div className="aday-cari-header">
                <input
                    type="text"
                    placeholder="Grup ara..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-bar"
                />
                <button
                    className="add-aday-cari-btn"
                    onClick={() => { setNewGroup(""); setEditGroup(null); setShowPopup(true); }}
                >
                    + Yeni Grup Ekle
                </button>
            </div>
            <div className="aday-cari-container">
                <div className="table-wrapper">
                    <table className="aday-cari-table">
                        <thead>
                            <tr>
                                <th>Grup Adı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td>Yükleniyor...</td></tr>
                            ) : groups.length > 0 ? (
                                groups.map((group) => (
                                    <tr
                                        key={group._id}
                                        onContextMenu={(e) => handleContextMenu(e, group)}
                                    >
                                        <td>{group.name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td>Henüz grup yok.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-modern">
                        <h3 className="popup-title">{editGroup ? "Grubu Düzenle" : "Yeni Grup Ekle"}</h3>
                        <input
                            type="text"
                            value={editGroup ? editGroup.name : newGroup}
                            onChange={(e) => editGroup ? setEditGroup({ ...editGroup, name: e.target.value }) : setNewGroup(e.target.value)}
                            placeholder="Grup adı girin"
                            className="popup-input"
                        />
                        <div className="popup-buttons">
                            <button className="popup-btn popup-btn-save" onClick={editGroup ? handleEditGroup : handleAddGroup}>
                                Kaydet
                            </button>
                            <button className="popup-btn popup-btn-cancel" onClick={() => setShowPopup(false)}>
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <div
                        className="context-menu-item"
                        onClick={() => { setEditGroup(contextMenu.group); setShowPopup(true); setContextMenu(null); }}
                    >
                        Düzenle
                    </div>
                    <div
                        className="context-menu-item delete"
                        onClick={() => handleDeleteGroup(contextMenu.group._id)}
                    >
                        Sil
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserGroups;
