import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

function Sidebar({ isOpen, onClose}){
    const { seller, logout } = useAuth();
    const navigate = useNavigate();

    const isInactive = !seller?.isActive;

    const handleLogout =() =>{
        logout();
        navigate("/login");
    };

    const handleLinkClick = ()=>{
        onClose();
    };

    const handleLockedClick = (e) => {
        e.preventDefault();
    };

return(
    <>
    {/* this shows dark overlay behind sidebar only when the sidebar is open on mobile. clicking it close the sidebar*/}

    {isOpen && (
        <div className={styles.overlay} onClick={onClose}></div>
    )}

    <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
        {/* brand name at the top */}
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
            } onClick={handleLinkClick}> Dashboard </NavLink>

            {isInactive ? (
                        <span className={`${styles.link} ${styles.lockedLink}`} onClick={handleLockedClick}>
                            Products
                        </span>
                    ) : (
                        <NavLink
                            to="/dashboard/products"
                            className={({ isActive }) =>
                                isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                            }
                            onClick={handleLinkClick}
                        >
                            Products
                        </NavLink>
                    )}
            

            {isInactive ? (
                        <span className={`${styles.link} ${styles.lockedLink}`} onClick={handleLockedClick}>
                            Categories
                        </span>
                    ) : (
                        <NavLink
                            to="/dashboard/categories"
                            className={({ isActive }) =>
                                isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                            }
                            onClick={handleLinkClick}
                        >
                            Categories
                        </NavLink>
                    )}

            
            {isInactive ? (
                        <span className={`${styles.link} ${styles.lockedLink}`} onClick={handleLockedClick}>
                            Inbox
                        </span>
                    ) : (
                        <NavLink
                            to="/dashboard/inbox"
                            className={({ isActive }) =>
                                isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                            }
                            onClick={handleLinkClick}
                        >
                            Inbox
                        </NavLink>
                    )}       



            <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            } onClick={handleLinkClick}> Settings </NavLink>


            <NavLink
            to="/aboutus"
            className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            } onClick={handleLinkClick}> About Us </NavLink>


            <NavLink
            to="/privacypolicy"
            className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            } onClick={handleLinkClick}> Privacy Policy </NavLink>


            <NavLink
            to="/termsofservice"
            className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            } onClick={handleLinkClick}> Terms of Service </NavLink>


        </nav>

        {/* logout button at the bottom */}
        <div className={styles.bottom}>
            <button className={styles.logoutButton} onClick={handleLogout}>
                Logout
            </button>
        </div>

    </div>
    </>
);
}

export default Sidebar;