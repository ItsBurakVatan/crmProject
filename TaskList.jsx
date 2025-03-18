import React, { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import api from "../api"; // axios yerine api import et
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import "../styles/adayCariKartlari.css";

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const response = await api.get("/tasks"); // api ile token gönderilir
                console.log("Tasks Response:", response.data); // Yanıtı kontrol et
                setTasks(response.data);
            } catch (error) {
                console.error("Error fetching tasks:", error.response ? error.response.data : error.message);
            }
            setLoading(false);
        };
        fetchTasks();
    }, []);

    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value) {
            try {
                const response = await api.get(`/tasks/search?query=${e.target.value}`);
                setTasks(response.data);
            } catch (error) {
                console.error("Error searching tasks:", error.response ? error.response.data : error.message);
            }
        } else {
            const response = await api.get("/tasks");
            setTasks(response.data);
        }
    };

    const handleEditTask = async () => {
        if (!editTask) return;
        try {
            const response = await api.put(`/tasks/${editTask._id}`, editTask);
            setTasks(tasks.map(task => task._id === editTask._id ? response.data : task));
            setEditTask(null);
            setShowPopup(false);
        } catch (error) {
            console.error("Error editing task:", error.response ? error.response.data : error.message);
        }
    };

    const handleDeleteTask = async (id) => {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(task => task._id !== id));
            setContextMenu(null);
        } catch (error) {
            console.error("Error deleting task:", error.response ? error.response.data : error.message);
        }
    };

    const handleContextMenu = (e, task) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, task });
    };

    const closeContextMenu = () => setContextMenu(null);

    return (
        <div onClick={closeContextMenu}>
            <Navbar />
            <div className="aday-cari-header">
                <input
                    type="text"
                    placeholder="Görev/Akt. ara..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-bar"
                />
                <button className="add-aday-cari-btn" onClick={() => navigate("/create-task")}>
                    + Görev/Akt. Ekle
                </button>
            </div>
            <div className="aday-cari-container">
                <div className="table-wrapper">
                    <table className="aday-cari-table">
                        <thead>
                            <tr>
                                <th>Görev/Akt. No</th>
                                <th>C/H Ünvanı</th>
                                <th>Görev/Akt. Tarihi</th>
                                <th>Görev/Akt. Bitiş Tarihi</th>
                                <th>Fiş Türü</th>
                                <th>Öncelik</th>
                                <th>Görev/Akt. Açan</th>
                                <th>Görev/Akt. Türü</th>
                                <th>İlişkili Kullanıcı</th>
                                <th>İlişkili Kullanıcı Grubu</th>
                                <th>Tamamlandı</th>
                                <th>Açıklama</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="12">Yükleniyor...</td></tr>
                            ) : tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <tr key={task._id} onContextMenu={(e) => handleContextMenu(e, task)}>
                                        <td data-label="Görev/Akt. No">{task.taskNo}</td>
                                        <td data-label="C/H Ünvanı">{task.adayCari?.chUnvani || "Bilinmiyor"}</td>
                                        <td data-label="Görev/Akt. Tarihi">{new Date(task.taskDate).toLocaleString()}</td>
                                        <td data-label="Görev/Akt. Bitiş Tarihi">{new Date(task.taskEndDate).toLocaleString()}</td>
                                        <td data-label="Fiş Türü">{task.receiptType?.name || "Bilinmiyor"}</td>
                                        <td data-label="Öncelik">{task.priority?.name || "Bilinmiyor"}</td>
                                        <td data-label="Görev/Akt. Açan">{task.createdBy?.username || "Bilinmiyor"}</td>
                                        <td data-label="Görev/Akt. Türü">{task.taskType?.name || "Bilinmiyor"}</td>
                                        <td data-label="İlişkili Kullanıcı">{task.relatedUser?.username || "-"}</td>
                                        <td data-label="İlişkili Kullanıcı Grubu">{task.relatedGroup?.name || "-"}</td>
                                        <td data-label="Tamamlandı">{task.completed ? "✓" : "-"}</td>
                                        <td data-label="Açıklama">{task.description || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="12">Henüz görev/aktivite yok.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-modern">
                        <h3 className="popup-title">Görev Düzenle</h3>
                        <input
                            type="text"
                            value={editTask?.description || ""}
                            onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                            placeholder="Açıklama"
                            className="popup-input"
                        />
                        <select
                            value={editTask?.completed ? "true" : "false"}
                            onChange={(e) => setEditTask({ ...editTask, completed: e.target.value === "true" })}
                        >
                            <option value="false">Tamamlanmadı</option>
                            <option value="true">Tamamlandı</option>
                        </select>
                        <div className="popup-buttons">
                            <button className="popup-btn popup-btn-save" onClick={handleEditTask}>
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
                <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <div
                        className="context-menu-item"
                        onClick={() => { setEditTask(contextMenu.task); setShowPopup(true); setContextMenu(null); }}
                    >
                        Düzenle
                    </div>
                    <div
                        className="context-menu-item delete"
                        onClick={() => handleDeleteTask(contextMenu.task._id)}
                    >
                        Sil
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskList;