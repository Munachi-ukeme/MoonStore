// This component sits fixed at the bottom of every StorePage.
// It reads localStorage to determine the buyer's state and shows
// the appropriate action, directing them to orders, email capture,
// or the homepage login.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSavedEmail } from "../utils/session";
import EmailCapturePopup from "../buyerComponent/EmailCapturePopup";
import styles from "./StoreBottomNav.module.css";

const StoreBottomNav = ({ sellerId, slug }) => {
    const navigate = useNavigate();
    const [savedEmail, setSavedEmail] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        setSavedEmail(getSavedEmail());
    }, []);


     const handleMyOrdersClick = () => {
       
         // goes to this seller's conversation list
            navigate(`/${slug}/orders`);
        };

        const handleDashboardClick = () => {
        if (savedEmail) {
            navigate("/my-orders");
            return;
        }
        setShowPopup(true);
        };

        const handlePopupClose = () => {
        setShowPopup(false);
        // re-check localStorage in case they just saved their email
        setSavedEmail(getSavedEmail());
    };

    

    return (
        <>
            <div className={styles.nav}>
                <button className={styles.navBtn} onClick={handleMyOrdersClick}>
                    <span className={styles.navIcon}>💬</span>
                    <span className={styles.navLabel}>My Orders</span>
                </button>

                 <button className={styles.navBtn} onClick={handleDashboardClick}>
                    <span className={styles.navIcon}>📊</span>
                    <span className={styles.navLabel}>Dashboard</span>
                </button>
            </div>

            <EmailCapturePopup
                show={showPopup}
                onClose={handlePopupClose}
                sellerId={sellerId}
            />
        </>
    );
};

export default StoreBottomNav;
