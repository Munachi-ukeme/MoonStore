import { useNavigate } from "react-router-dom";
import { adminLogout } from "../api/api";
import styles from "./AdminSidebar.module.css";

const AdminSidebar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await adminLogout();
        localStorage.removeItem("moonstore_admin_token");
        navigate("/admin/login");
    };

    return (
        <div className={styles.sidebar}>
            <p className={styles.logo}>MoonStore Admin</p>
            <nav className={styles.nav}>
                <a href="/admin/sellers" className={styles.navLink}>Sellers</a>
                <a href="/admin/referrals" className={styles.navLink}>Referrals</a>
            </nav>
            <button className={styles.logoutBtn} onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
};

export default AdminSidebar;