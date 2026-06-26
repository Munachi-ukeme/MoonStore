import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBuyerConversations } from "../api/api";
import { getSavedEmail } from "../utils/session";
import styles from "./BuyerDashboard.module.css";

const BuyerDashboard = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const email = getSavedEmail();

        // if buyer has no saved email, redirect to homepage
        if (!email) {
            navigate("/");
            return;
        }

        const loadConversations = async () => {
            // retrieve all session IDs linked to this buyer
            // JSON.parse safely reads the array we stored as a string
            const stored = localStorage.getItem("moonstore_session_ids");
            const sessionIds = stored ? JSON.parse(stored) : [];

            if (sessionIds.length === 0) {
                setLoading(false);
                return;
            }

             const result = await getBuyerConversations(sessionIds);

            if (result.error) {
                setError(result.error);
            } else {
                setConversations(result.conversations || []);
            }

            setLoading(false);
        };

        loadConversations();
    }, [navigate]);

    const renderBadge = (status) => {
        if (status === "paid") {
            return <span className={`${styles.badge} ${styles.paidBadge}`}>Paid</span>;
        }
        if (status === "active") {
            return <span className={`${styles.badge} ${styles.activeBadge}`}>Active</span>;
        }
        return <span className={`${styles.badge} ${styles.newBadge}`}>New</span>;
    };


      const renderContent = () => {
        if (loading) {
            return <p className={styles.stateText}>Loading your orders...</p>;
        }

        if (error) {
            return <p className={styles.errorText}>{error}</p>;
        }

        if (conversations.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <p className={styles.emptyIcon}>🛍️</p>
                    <p className={styles.emptyTitle}>No orders yet</p>
                    <p className={styles.emptyText}>
                        Visit any MoonStore seller and click Order Now to start shopping.
                    </p>
                </div>
            );
        }

        return (
            <div className={styles.list}>
                {conversations?.map((conv) => (
                    <div key={conv._id} className={styles.row}>
                        <div className={styles.rowInfo}>
                            <p className={styles.sellerName}>{conv.sellerId?.businessName}</p>
                            <p className={styles.productName}>{conv.productId?.name}</p>
                        </div>
                        <div className={styles.rowRight}>
                            {renderBadge(conv.status)}
                            <button
                                className={styles.viewBtn}
                                onClick={() => navigate(`/${conv.sellerId?.slug}/chat/${conv._id}`)}
                            >
                                View Chat
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

     return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1 className={styles.title}>My Orders</h1>
            </div>

            {renderContent()}
        </div>
    );
};


    export default BuyerDashboard;