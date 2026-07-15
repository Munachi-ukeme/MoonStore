import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./TrialBanner.module.css";

const TrialBanner = () => {
    const { seller } = useContext(AuthContext);
    const navigate = useNavigate();

    if (!seller) return null;

    // if seller has an active paid subscription, never show the banner
    const now = new Date();
    const hasActiveSub = seller.subscriptionEnd && new Date(seller.subscriptionEnd) > now;
    if (hasActiveSub) return null;

    // if no trialEnd, not a trial seller — don't show
    if (!seller.trialEnd) return null;

    const trialEndDate = new Date(seller.trialEnd);
    const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

    // trial already expired
    if (daysLeft <= 0) {
        return (
            <div className={`${styles.banner} ${styles.expired}`}>
                <span className={styles.text}>
                    ⚠️ Your free trial has ended. Subscribe to reactivate your store.
                </span>
                <button
                    className={styles.subscribeBtn}
                    onClick={() => navigate("/dashboard/settings")}
                >
                    Subscribe Now
                </button>
            </div>
        );
    }

    // trial still active
    return (
        <div className={`${styles.banner} ${styles.active}`}>
            <span className={styles.text}>
                🎉 Free trial: <strong>{daysLeft} {daysLeft === 1 ? "day" : "days"}</strong> left
            </span>
            <button
                className={styles.subscribeBtn}
                onClick={() => navigate("/dashboard/settings")}
            >
                Subscribe
            </button>
        </div>
    );
};

export default TrialBanner;