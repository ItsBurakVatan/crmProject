import React, { useState, useEffect, useContext } from "react";
import Navbar from './Navbar';
import api from "../api";
import { AuthContext } from "../authContext";
import "../styles/createAdayCari.css";
import { useNavigate } from "react-router-dom";

const CreateTask = () => {
    const [info, setInfo] = useState({ taskNo: 1, completed: false });
    const [popup, setPopup] = useState({ show: false, message: "", isError: false });
    const [adayCaris, setAdayCaris] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [receiptTypes, setReceiptTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            console.log("Kullanıcı giriş yapmamış, yönlendiriliyor...");
            navigate("/login");
            return;
        }

        const fetchInitialData = async () => {
            console.log("Fetching initial data for CreateTask, User:", user);
            try {
                const [taskRes, adayRes, typeRes, priorityRes, receiptRes, userRes, groupRes] = await Promise.all([
                    api.get(`/tasks`),
                    api.get(`/adaycaris/${user._id}`),
                    api.get("/tasks/taskTypes"),
                    api.get("/tasks/priorities"),
                    api.get("/tasks/receiptTypes"),
                    api.get("/tasks/users"),
                    api.get("/adaycaris/groups"),
                ]);
                console.log("Tasks Response:", taskRes.data);
                console.log("Aday Caris Response:", adayRes.data);
                console.log("Task Types Response:", typeRes.data);
                console.log("Priorities Response:", priorityRes.data);
                console.log("Receipt Types Response:", receiptRes.data);
                console.log("Users Response:", userRes.data);
                console.log("Groups Response:", groupRes.data);

                const tasks = Array.isArray(taskRes.data) ? taskRes.data : [];
                const lastTask = tasks.length > 0 ? tasks.sort((a, b) => (b.taskNo || 0) - (a.taskNo || 0))[0] : null;
                setInfo((prev) => ({ ...prev, taskNo: lastTask ? (lastTask.taskNo || 0) + 1 : 1, createdBy: user._id }));

                const adayCarisData = adayRes.data.data || adayRes.data;
                setAdayCaris(Array.isArray(adayCarisData) ? adayCarisData : []);

                setTaskTypes(Array.isArray(typeRes.data) ? typeRes.data : []);
                setPriorities(Array.isArray(priorityRes.data) ? priorityRes.data : []);
                setReceiptTypes(Array.isArray(receiptRes.data) ? receiptRes.data : []);
                setUsers(Array.isArray(userRes.data) ? userRes.data : []);
                setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
            } catch (err) {
                console.error("Error fetching initial data:", err.response ? err.response.data : err.message);
                if (err.response && err.response.status === 401) {
                    console.log("401 Unauthorized: Token eksik veya geçersiz, giriş yapmayı deneyin.");
                    navigate("/login");
                }
            }
        };
        if (user && user._id) fetchInitialData();
    }, [user, navigate]);

    const handleChange = (e) => {
        setInfo((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleCompletedToggle = () => {
        setInfo((prev) => ({ ...prev, completed: !prev.completed }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newTask = { 
            ...info,
            description: info.description || "",
            adayCari: info.adayCari || null,
            taskDate: info.taskDate || null,
            taskEndDate: info.taskEndDate || null,
            receiptType: info.receiptType || null,
            priority: info.priority || null,
            createdBy: user._id,
            taskType: info.taskType || null,
            relatedUser: info.relatedUser || null,
            relatedGroup: info.relatedGroup || null,
            completed: info.completed || false,
        };
    
        try {
            await api.post("/tasks", newTask);
            setPopup({ show: true, message: "Görev/Aktivite başarıyla eklendi!", isError: false });
            setTimeout(() => {
                setPopup({ show: false, message: "", isError: false });
                navigate('/tasks');
            }, 2000);
        } catch (err) {
            setPopup({ show: true, message: `Hata: ${err.response?.data?.message || err.message}`, isError: true });
            setTimeout(() => setPopup({ show: false, message: "", isError: false }), 2000);
        }
    };

    return (
        <div className="create-aday-cari-container">
            <Navbar />
            <div className="form-container">
                <h2>Görev/Akt. Ekle</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Görev/Aktivite No</label>
                        <input type="number" id="taskNo" value={info.taskNo} disabled />
                    </div>
                    <div className="input-group">
                        <label>C/H Ünvanı - Aday Cari</label>
                        <select id="adayCari" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {adayCaris.map((aday) => (
                                <option key={aday._id} value={aday._id}>{aday.chUnvani}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Görev/Aktivite Tarihi</label>
                        <input type="datetime-local" id="taskDate" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Görev/Aktivite Bitiş Tarihi</label>
                        <input type="datetime-local" id="taskEndDate" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Fiş Türü</label>
                        <select id="receiptType" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {receiptTypes.map((type) => (
                                <option key={type._id} value={type._id}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Öncelik</label>
                        <select id="priority" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {priorities.map((priority) => (
                                <option key={priority._id} value={priority._id}>{priority.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Görev/Aktivite Açan</label>
                        <input type="text" id="createdBy" value={user?.username || "Bilinmiyor"} disabled />
                    </div>
                    <div className="input-group">
                        <label>Görev/Aktivite Türü</label>
                        <select id="taskType" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {taskTypes.map((type) => (
                                <option key={type._id} value={type._id}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>İlişkili Kullanıcı</label>
                        <select id="relatedUser" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>{user.username}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>İlişkili Kullanıcı Grubu</label>
                        <select id="relatedGroup" onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {groups.map((group) => (
                                <option key={group._id} value={group._id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Tamamlandı</label>
                        <button
                            type="button"
                            className={`complete-btn ${info.completed ? "completed" : ""}`}
                            onClick={handleCompletedToggle}
                        >
                            {info.completed ? "✓" : ""}
                        </button>
                    </div>
                    <div className="input-group">
                        <label>Açıklama</label>
                        <textarea id="description" onChange={handleChange} />
                    </div>
                    <div className="button-group">
                        <button type="submit" className="save-btn">Kaydet</button>
                        <button type="button" className="cancel-btn" onClick={() => navigate('/tasks')}>
                            Vazgeç
                        </button>
                    </div>
                </form>
                {popup.show && (
                    <div className={`popup ${popup.isError ? "error" : "success"}`}>
                        {popup.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateTask;