import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import api from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import useFetch from "../useFetch";
import { AuthContext } from "../authContext";
import "../styles/adayCariKartlari.css";
import debounce from "lodash/debounce";

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = React.useContext(AuthContext);
    const [options, setOptions] = useState({
        receiptTypes: [],
        priorities: [],
        taskTypes: [],
    });
    const navigate = useNavigate();
    const location = useLocation();

    const { data, loading: fetchLoading, error: fetchError, reFetch, fetch } = useFetch(`/tasks?page=${page}&limit=10`, { debounceTime: 500, autoFetch: true });

    useEffect(() => {
        if (data) {
            setTasks(data.data || []);
            setTotalPages(data.pages || 1);
            setLoading(fetchLoading);
            setError(fetchError ? fetchError.message : null);
        } else if (fetchError) {
            setError("Görevler yüklenemedi: " + (fetchError.message || "Yetkisiz erişim!"));
        }
    }, [data, fetchLoading, fetchError]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [receiptTypes, priorities, taskTypes] = await Promise.all([
                    api.get("/tasks/receiptTypes"),
                    api.get("/tasks/priorities"),
                    api.get("/tasks/taskTypes"),
                ]);
                setOptions({
                    receiptTypes: receiptTypes.data,
                    priorities: priorities.data,
                    taskTypes: taskTypes.data,
                });
            } catch (error) {
                setError("Combobox verileri yüklenemedi!");
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        if (location.state?.refresh) {
            reFetch();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, reFetch, navigate]);

    const debouncedSearch = debounce(async (query) => {
        if (query) {
            try {
                const response = await api.get(`/tasks/search?query=${query}&page=${page}&limit=10`);
                setTasks(response.data.data);
                setTotalPages(response.data.pages);
                setError(null);
            } catch (error) {
                setError(error.response?.data?.message || "Arama sırasında hata oluştu.");
            }
        } else {
            reFetch();
        }
    }, 300);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        debouncedSearch(e.target.value);
    };

    const handleManualFetch = () => {
        fetch(); // Manuel veri yenileme
    };

    const handleEditTask = async () => {
        if (user.role === "staff") {
            setError("Bu işlem için yetkiniz yok!");
            setTimeout(() => setError(null), 3000);
            return;
        }
        if (!editTask) return;
        try {
            const taskToUpdate = {
                description: editTask.description || "",
                completed: editTask.completed !== undefined ? editTask.completed : editTask.completed,
                receiptType: editTask.receiptType?._id || undefined,
                priority: editTask.priority?._id || undefined,
                taskType: editTask.taskType?._id || undefined
            };
            const response = await api.put(`/tasks/${editTask._id}`, taskToUpdate);
            setTasks(tasks.map(task => task._id === editTask._id ? response.data : task));
            setEditTask(null);
            setShowPopup(false);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Görev düzenlenemedi.");
        }
    };

    const handleDeleteTask = async (id) => {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(task => task._id !== id));
            setContextMenu(null);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Görev silinemedi.");
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
                <div>
                    <button className="add-aday-cari-btn" onClick={() => navigate("/create-task")}>
                        + Görev/Akt. Ekle
                    </button>
                    <button className="refresh-btn" onClick={handleManualFetch}>
                        Verileri Yenile
                    </button>
                </div>
            </div>
            <div className="aday-cari-container">
                {error && <div className="error-message">{error}</div>}
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
                <div className="pagination">
                    <button onClick={() => setPage(page - 1)} disabled={page === 1}>Önceki</button>
                    <span>Sayfa {page} / {totalPages}</span>
                    <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Sonraki</button>
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
                        <select
                            value={editTask?.receiptType?._id || ""}
                            onChange={(e) => setEditTask({ ...editTask, receiptType: options.receiptTypes.find(rt => rt._id === e.target.value) })}
                        >
                            <option value="">Fiş Türü Seç</option>
                            {options.receiptTypes.map((type) => (
                                <option key={type._id} value={type._id}>{type.name}</option>
                            ))}
                        </select>
                        <select
                            value={editTask?.priority?._id || ""}
                            onChange={(e) => setEditTask({ ...editTask, priority: options.priorities.find(p => p._id === e.target.value) })}
                        >
                            <option value="">Öncelik Seç</option>
                            {options.priorities.map((priority) => (
                                <option key={priority._id} value={priority._id}>{priority.name}</option>
                            ))}
                        </select>
                        <select
                            value={editTask?.taskType?._id || ""}
                            onChange={(e) => setEditTask({ ...editTask, taskType: options.taskTypes.find(tt => tt._id === e.target.value) })}
                        >
                            <option value="">Görev Türü Seç</option>
                            {options.taskTypes.map((type) => (
                                <option key={type._id} value={type._id}>{type.name}</option>
                            ))}
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
                        className={`context-menu-item ${user.role === "staff" ? "disabled" : ""}`}
                        onClick={() => {
                            if (user.role !== "staff") {
                                setEditTask(contextMenu.task);
                                setShowPopup(true);
                                setContextMenu(null);
                            }
                        }}
                    >
                        Düzenle
                    </div>
                    <div
                        className={`context-menu-item delete ${user.role === "staff" ? "disabled" : ""}`}
                        onClick={() => {
                            if (user.role !== "staff") {
                                handleDeleteTask(contextMenu.task._id);
                            }
                        }}
                    >
                        Sil
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskList;
