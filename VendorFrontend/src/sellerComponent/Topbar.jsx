import { useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import styles from "./Topbar.module.css";

function Topbar({ onOpen, onToggle, isWide, sidebarOpen }) {
    const { seller } = useAuth();
    const location = useLocation();

    let pageTitle;
    if (location.pathname === "/dashboard") {
        pageTitle = "Dashboard";
    } else if (location.pathname === "/dashboard/products") {
        pageTitle = "Products";
    } else if (location.pathname === "/dashboard/categories") {
        pageTitle = "Categories"
    } else if (location.pathname === "/dashboard/settings") {
        pageTitle = "Settings"
    } else if (location.pathname === "/dashboard/privacy-policy") {
        pageTitle = "Privacy Policy"
    } else if (location.pathname === "/dashboard/terms-of-service") {
        pageTitle = "Terms Of Service"
    } else if (location.pathname === "/dashboard/inbox") {
        pageTitle = "Inbox"
    } else {
        pageTitle = "Dashboard"
    }

    let planClass;
    if (seller?.plan === "basic") {
        planClass = styles.planBasic;
    } else if (seller?.plan === "pro") {
        planClass = styles.planPro;
    } else if (seller?.plan === 'premium') {
        planClass = styles.planPremium;
    } else {
        planClass = styles.planBasic;
    }

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

            <div className={`${styles.planBadge} ${planClass}`}>{seller?.plan}</div>
        </div>
    );
}

export default Topbar;