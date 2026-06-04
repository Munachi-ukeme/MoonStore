// This component is used in TWO places:
// 1. StorePage — appears after 5 seconds (triggered by timer)
// 2. Inside chat — appears after first message (triggered by parent)
// The trigger is controlled by the parent via the `show` prop.
// This keeps the popup logic in one place — clean and reusable.

import { useState } from "react";
import { saveBuyerEmail } from "../api/api";
import { saveBuyerEmailLocally, markPopupDismissed, getOrCreateSessionId } from "../utils/session";
import styles from "./EmailCapturePopup.module.css";

const EmailCapturePopup = ({ show, onClose, sellerId }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

     const handleSubmit = async () => {
        setError("");
        if (!email.trim()) {
            setError("Please enter your email");
            return;
        }

         setLoading(true);
        const sessionId = getOrCreateSessionId();
        const result = await saveBuyerEmail(email.trim(), sessionId, sellerId);
        setLoading(false);

         if (result.error) {
            setError(result.error);
            return;
        }

        // save email locally so popup never shows again on this device
        saveBuyerEmailLocally(email.trim());
        setSuccess(true);

        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const handleDismiss = () => {
        // markPopupDismissed uses sessionStorage — resets when tab closes
        markPopupDismissed();
        onClose();
    };

    if (!show) return null;


    return (
        // overlay — the dark background behind the popup
        // stopping propagation on the card prevents the overlay click from
        // closing the popup when user clicks inside the card itself
        <div className={styles.overlay} onClick={handleDismiss}>
            <div className={styles.card} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleDismiss}>✕</button> 

                {success ? (
                    <div className={styles.successState}>
                        <p className={styles.successIcon}>✓</p>
                        <p className={styles.successText}>Email saved! You can now track your orders from any device.</p>
                    </div>
                ) : (
                    <>
                        <p className={styles.title}>Save your orders 📦</p>
                        <p className={styles.text}>
                            Enter your email to access your chat history and get
                            notified when the seller replies.
                        </p>
                        <input
                            className={styles.input}
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {error ? <p className={styles.error}>{error}</p> : null}
                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save My Email"}
                        </button>
                        <button className={styles.skipBtn} onClick={handleDismiss}>
                            Skip for now
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailCapturePopup;