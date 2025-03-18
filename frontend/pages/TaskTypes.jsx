import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import "../styles/adayCariKartlari.css";

const TaskTypes = () => {
    const [taskTypes, setTaskTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [newTaskType, setNewTaskType] = useState("");
    const [editTaskType, setEditTaskType] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        const fetchTaskTypes = async () => {
            setLoading(true);
            try {
                const response = await axios.get("http://localhost:7700/api/taskTypes");
                setTaskTypes(response.data);
            } catch (error) {
                console.error("Error fetching task types:", error);
            }
            setLoading(false);
        };
        fetchTaskTypes();
    }, []);

    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value) {
            try {
                const response = await axios.get(`http://localhost:7700/api/taskTypes/search?query=${e.target.value}`);
                setTaskTypes(response.data);
            } catch (error) {
                console.error("Error searching task types:", error);
            }
        } else {
            const response = await axios.get("http://localhost:7700/api/taskTypes");
            setTaskTypes(response.data);
        }
    };

    const handleAddTaskType = async () => {
        if (!newTaskType) return;
        try {
            const response = await axios.post("http://localhost:7700/api/taskTypes", { name: newTaskType });
            setTaskTypes([...taskTypes, response.data]);
            setNewTaskType("");
            setShowPopup(false);
        } catch (error) {
            console.error("Error adding task type:", error);
        }
    };

    const handleEditTaskType = async () => {
        if (!editTaskType || !editTaskType.name) return;
        try {
            const response = await axios.put(`http://localhost:7700/api/taskTypes/${editTaskType._id}`, { name: editTaskType.name });
            setTaskTypes(taskTypes.map(task => task._id === editTaskType._id ? response.data : task));
            setEditTaskType(null);
            setShowPopup(false);
        } catch (error) {
            console.error("Error editing task type:", error);
        }
    };

    const handleDeleteTaskType = async (id) => {
        try {
            await axios.delete(`http://localhost:7700/api/taskTypes/${id}`);
            setTaskTypes(taskTypes.filter(task => task._id !== id));
            setContextMenu(null);
        } catch (error) {
            console.error("Error deleting task type:", error);
        }
    };

    const handleContextMenu = (e, taskType) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            taskType
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    return (
        <div onClick={closeContextMenu}>
            <Navbar />
            <div className="aday-cari-header">
                <input
                    type="text"
                    placeholder="Görev türü ara..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-bar"
                />
                <button
                    className="add-aday-cari-btn"
                    onClick={() => { setNewTaskType(""); setEditTaskType(null); setShowPopup(true); }}
                >
                    + Yeni Görev Türü Ekle
                </button>
            </div>
            <div className="aday-cari-container">
                <div className="table-wrapper">
                    <table className="aday-cari-table">
                        <thead>
                            <tr>
                                <th>Görev/Aktivite Türü</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td>Yükleniyor...</td></tr>
                            ) : taskTypes.length > 0 ? (
                                taskTypes.map((taskType) => (
                                    <tr
                                        key={taskType._id}
                                        onContextMenu={(e) => handleContextMenu(e, taskType)}
                                    >
                                        <td>{taskType.name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td>Henüz görev türü yok.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-modern">
                        <h3 className="popup-title">{editTaskType ? "Görev Türünü Düzenle" : "Yeni Görev Türü Ekle"}</h3>
                        <input
                            type="text"
                            value={editTaskType ? editTaskType.name : newTaskType}
                            onChange={(e) => editTaskType ? setEditTaskType({ ...editTaskType, name: e.target.value }) : setNewTaskType(e.target.value)}
                            placeholder="Görev türü adı girin"
                            className="popup-input"
                        />
                        <div className="popup-buttons">
                            <button className="popup-btn popup-btn-save" onClick={editTaskType ? handleEditTaskType : handleAddTaskType}>
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
                        onClick={() => { setEditTaskType(contextMenu.taskType); setShowPopup(true); setContextMenu(null); }}
                    >
                        Düzenle
                    </div>
                    <div
                        className="context-menu-item delete"
                        onClick={() => handleDeleteTaskType(contextMenu.taskType._id)}
                    >
                        Sil
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskTypes;
