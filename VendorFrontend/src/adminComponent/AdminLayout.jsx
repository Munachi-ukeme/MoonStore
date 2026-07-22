import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({ children }) => (
    <div style={{ display: "flex" }}>
        <AdminSidebar />
        <div style={{ marginLeft: "220px", padding: "20px", flex: 1 }}>
            {children}
        </div>
    </div>
);

export default AdminLayout;