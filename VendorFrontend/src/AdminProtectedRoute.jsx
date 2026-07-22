import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
    const adminToken = localStorage.getItem("moonstore_admin_token");

    if (!adminToken) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminProtectedRoute;