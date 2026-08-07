import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

const Sidebar = ({ isOpen, onClose, onToggle, isWide }) => {
    const { seller, logout } = useAuth();
    const navigate = useNavigate();
    const [showLockedPopup, setShowLockedPopup] = useState(false);

    const isLocked = !seller?.subaccountVerified;

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const handleLinkClick = () => {
        onClose();
    };

    const handleLockedLinkClick = (e) => {
        if (isLocked) {
            e.preventDefault();
            setShowLockedPopup(true);
        } else {
            handleLinkClick();
        }
    };

    return (
        <>
            {/* dark overlay behind sidebar on mobile */}
            {isOpen && !isWide && (
                <div className={styles.overlay} onClick={onClose}></div>
            )}

            <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
                {isWide && isOpen && (
                    <button className={styles.edgeToggle} onClick={onToggle}>
                        ✕
                    </button>
                )}

                {/* brand name at top */}
                <div className={styles.brand}>
                    <h1 className={styles.brandName}>MoonStore</h1>
                    <p className={styles.businessName}>{seller?.businessName}</p>
                </div>

                {/* Navigation links */}
                <nav className={styles.nav}>
                    <NavLink
                        to="/dashboard"
                        end
                        className={({ isActive }) =>
                            isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                        }
                        onClick={handleLinkClick}
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/dashboard/products"
                        className={
                            isLocked
                                ? `${styles.link} ${styles.lockedLink}`
                                : ({ isActive }) =>
                                      isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                        }
                        onClick={handleLockedLinkClick}
                    >
                        Products {isLocked ? "🔒" : ""}
                    </NavLink>

                    <NavLink
                        to="/dashboard/categories"
                        className={
                            isLocked
                                ? `${styles.link} ${styles.lockedLink}`
                                : ({ isActive }) =>
                                      isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                        }
                        onClick={handleLockedLinkClick}
                    >
                        Categories {isLocked ? "🔒" : ""}
                    </NavLink>

                    <NavLink
                        to="/dashboard/inbox"
                        className={({ isActive }) =>
                            isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                        }
                        onClick={handleLinkClick}
                    >
                        Inbox
                    </NavLink>

                    <NavLink
                        to="/dashboard/settings"
                        className={({ isActive }) =>
                            isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                        }
                        onClick={handleLinkClick}
                    >
                        Settings
                    </NavLink>

                    <a
                        href={`https://wa.me/2349132227203?text=${encodeURIComponent(`Feedback from ${seller?.businessName}: `)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.feedbackBtn}
                    >
                        Share Feedback
                    </a>
                </nav>

                {/* logout button */}
                <div className={styles.bottom}>
                    <button className={styles.logoutButton} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Locked feature popup */}
            {showLockedPopup ? (
                <div className={styles.popupOverlay}>
                    <div className={styles.popup}>
                        <button
                            className={styles.popupClose}
                            onClick={() => setShowLockedPopup(false)}
                        >
                            ✕
                        </button>
                        <p className={styles.popupTitle}>Your store is under review</p>
                        <p className={styles.popupText}>
                            It will be unlocked within the next 24 hours. Use this time to set
                            your store up properly by adding your business logo, banner, and
                            other details in Settings if you have not done so.
                        </p>
                        <button
                            className={styles.popupBtn}
                            onClick={() => {
                                setShowLockedPopup(false);
                                navigate("/dashboard/settings");
                            }}
                        >
                            Go to Settings
                        </button>
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default Sidebar;