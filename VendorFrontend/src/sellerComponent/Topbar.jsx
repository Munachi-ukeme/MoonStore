import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Topbar.module.css";

const Topbar = ({ onOpen, onToggle, isWide, sidebarOpen }) => {
    const { seller } = useAuth();
    const location = useLocation();

    const titleMap = {
        "/dashboard": "Dashboard",
        "/dashboard/products": "Products",
        "/dashboard/categories": "Categories",
        "/dashboard/settings": "Settings",
        "/dashboard/privacy-policy": "Privacy Policy",
        "/dashboard/terms-of-service": "Terms Of Service",
        "/dashboard/inbox": "Inbox",
    };

    const pageTitle = titleMap[location.pathname] || "Dashboard";

    const handleMenuClick = () => {
        if (isWide) {
            onToggle();
        } else {
            onOpen();
        }
    };

    return (
        <div className={styles.topbar}>
            {(!isWide || !sidebarOpen) && (
                <button className={styles.menuButton} onClick={handleMenuClick}>
                    ☰
                </button>
            )}

            <h2 className={styles.pageTitle}>{pageTitle}</h2>
        </div>
    );
};

export default Topbar;