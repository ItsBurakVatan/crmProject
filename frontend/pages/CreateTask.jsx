import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "./Navbar";
import "../styles/createAdayCari.css";

const CreateTask = () => {
    const [task, setTask] = useState({
        adayCari: "",
        taskDate: "",
        taskEndDate: "",
        receiptType: "",
        priority: "",
        taskType: "",
        relatedUser: "",
        relatedGroup: "",
        description: "",
        completed: false,
    });
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState(""); // Genel hata mesajı için
    const [options, setOptions] = useState({
        adayCaris: [],
        receiptTypes: [],
        priorities: [],
        taskTypes: [],
        users: [],
        groups: [],
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [adayCaris, receiptTypes, priorities, taskTypes, users, groups] = await Promise.all([
                    api.get(`/adaycaris/${JSON.parse(localStorage.getItem("user"))?._id}`),
                    api.get("/tasks/receiptTypes"),
                    api.get("/tasks/priorities"),
                    api.get("/tasks/taskTypes"),
                    api.get("/tasks/users"),
                    api.get("/tasks/groups"),
                ]);
                setOptions({
                    adayCaris: adayCaris.data.data,
                    receiptTypes: receiptTypes.data,
                    priorities: priorities.data,
                    taskTypes: taskTypes.data,
                    users: users.data,
                    groups: groups.data,
                });
            } catch (error) {
                setErrors({ submit: "Seçenekler yüklenemedi: " + (error.response?.data?.message || "Yetkisiz erişim!") });
            }
        };
        fetchOptions();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTask((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" })); // Hata mesajını sıfırla
        setGeneralError(""); // Genel hata mesajını sıfırla
    };

    const validateForm = () => {
        const newErrors = {};
        if (!task.adayCari) newErrors.adayCari = "Aday cari zorunlu!";
        if (!task.taskDate) newErrors.taskDate = "Görev tarihi zorunlu!";
        if (!task.taskEndDate) newErrors.taskEndDate = "Görev bitiş tarihi zorunlu!";
        if (!task.receiptType) newErrors.receiptType = "Fiş türü zorunlu!";
        if (!task.priority) newErrors.priority = "Öncelik zorunlu!";
        if (!task.taskType) newErrors.taskType = "Görev türü zorunlu!";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setGeneralError("");

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setGeneralError("Lütfen yukarıdaki zorunlu alanları doldurun veya hataları düzeltin.");
            return;
        }

        try {
            await api.post("/tasks/", task);
            navigate("/tasks");
        } catch (error) {
            setErrors({ submit: error.response?.data?.message || "Görev oluşturulamadı!" });
            setGeneralError("Bir hata oluştu, lütfen tekrar deneyin.");
        }
    };

    return (
        <div className="create-aday-cari-container">
            <Navbar />
            <div className="form-container">
                <h2>Yeni Görev/Aktivite</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Aday Cari</label>
                        <select name="adayCari" value={task.adayCari} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {options.adayCaris.map((aday) => (
                                <option key={aday._id} value={aday._id}>{aday.chUnvani}</option>
                            ))}
                        </select>
                        {errors.adayCari && <span className="error">{errors.adayCari}</span>}
                    </div>
                    <div className="input-group">
                        <label>Görev/Aktivite Tarihi</label>
                        <input type="datetime-local" name="taskDate" value={task.taskDate} onChange={handleChange} />
                        {errors.taskDate && <span className="error">{errors.taskDate}</span>}
                    </div>
                    <div className="input-group">
                        <label>Görev/Aktivite Bitiş Tarihi</label>
                        <input type="datetime-local" name="taskEndDate" value={task.taskEndDate} onChange={handleChange} />
                        {errors.taskEndDate && <span className="error">{errors.taskEndDate}</span>}
                    </div>
                    <div className="input-group">
                        <label>Fiş Türü</label>
                        <select name="receiptType" value={task.receiptType} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {options.receiptTypes.map((type) => (
                                <option key={type._id} value={type._id}>{type.name}</option>
                            ))}
                        </select>
                        {errors.receiptType && <span className="error">{errors.receiptType}</span>}
                    </div>
                    <div className="input-group">
                        <label>Öncelik</label>
                        <select name="priority" value={task.priority} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {options.priorities.map((priority) => (
                                <option key={priority._id} value={priority._id}>{priority.name}</option>
                            ))}
                        </select>
                        {errors.priority && <span className="error">{errors.priority}</span>}
                    </div>
                    <div className="input-group">
                        <label>Görev/Aktivite Türü</label>
                        <select name="taskType" value={task.taskType} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {options.taskTypes.map((type) => (
                                <option key={type._id} value={type._id}>{type.name}</option>
                            ))}
                        </select>
                        {errors.taskType && <span className="error">{errors.taskType}</span>}
                    </div>
                    <div className="input-group">
                        <label>İlişkili Kullanıcı</label>
                        <select name="relatedUser" value={task.relatedUser} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {options.users.map((user) => (
                                <option key={user._id} value={user._id}>{user.username}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>İlişkili Kullanıcı Grubu</label>
                        <select name="relatedGroup" value={task.relatedGroup} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            {options.groups.map((group) => (
                                <option key={group._id} value={group._id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Açıklama</label>
                        <textarea name="description" value={task.description} onChange={handleChange}></textarea>
                        {errors.description && <span className="error">{errors.description}</span>}
                    </div>
                    {errors.submit && <div className="error-message">{errors.submit}</div>}
                    <div className="button-group">
                        <button type="submit" className="save-btn">Kaydet</button>
                        <button type="button" className="cancel-btn" onClick={() => navigate("/tasks")}>
                            İptal
                        </button>
                    </div>
                    {generalError && <div className="general-error">{generalError}</div>}
                </form>
            </div>
        </div>
    );
};

export default CreateTask;
