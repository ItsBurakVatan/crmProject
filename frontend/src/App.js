import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./authContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdayCariKartlari from "./pages/AdayCariKartlari";
import CreateAdayCari from "./pages/CreateAdayCari";
import TaskList from "./pages/TaskList";
import CreateTask from "./pages/CreateTask";
import AdayCariStatusPage from "./pages/AdayCariStatusPage";
import CustomerStatus from "./pages/CustomerStatus";
import TaskTypes from "./pages/TaskTypes";
import UserGroups from "./pages/UserGroups";
import UserManagement from "./pages/UserManagement";    
import Reports from "./pages/Reports";

function App() {
    const { user } = useContext(AuthContext);

    const ProtectedRoute = ({ children }) => {
        if (!user) return <Login />;
        return children;    
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/aday-caris" element={<ProtectedRoute><AdayCariKartlari /></ProtectedRoute>} />
                <Route path="/create-aday-cari" element={<ProtectedRoute><CreateAdayCari /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
                <Route path="/create-task" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
                <Route path="/aday-cari-status" element={<ProtectedRoute><AdayCariStatusPage /></ProtectedRoute>} />
                <Route path="/definitions/customer-status" element={<ProtectedRoute><CustomerStatus /></ProtectedRoute>} />
                <Route path="/definitions/task-types" element={<ProtectedRoute><TaskTypes /></ProtectedRoute>} />
                <Route path="/definitions/user-groups" element={<ProtectedRoute><UserGroups /></ProtectedRoute>} />
                <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                <Route path="/reports/tasks" element={<ProtectedRoute><Reports reportType="tasks" /></ProtectedRoute>} />
                <Route path="/reports/users" element={<ProtectedRoute><Reports reportType="users" /></ProtectedRoute>} />
                <Route path="/reports/customer-status" element={<ProtectedRoute><Reports reportType="customer-status" /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
