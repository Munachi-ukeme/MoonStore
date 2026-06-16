import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSellerConversations } from "../api/api";
import { getOrCreateSessionId, getSavedEmail } from "../utils/session";
import styles from "./BuyerOrdersPage.module.css";

const BuyerOrdersPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadConversations = async () => {
            const sessionId = getOrCreateSessionId();
            const result = await getSellerConversations(slug, sessionId);
            if (result.error) {
                setError(result.error);
            } else {
                setConversations(result.conversations || []);
            }
            setLoading(false);
        };
        loadConversations();
    }, [slug]);

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

        if (conversations?.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <p className={styles.emptyIcon}>🛍️</p>
                    <p className={styles.emptyTitle}>No orders yet</p>
                    <p className={styles.emptyText}>
                        Browse this store and tap Order Now on any product to start a conversation.
                    </p>
                    <button
                        className={styles.browseBtn}
                        onClick={() => navigate(`/${slug}`)}
                    >
                        Browse Store
                    </button>
                </div>
            );
        }

        return (
            <div className={styles.list}>
                {conversations?.map((conv) => (
                    <button
                        key={conv._id}
                        className={styles.row}
                        onClick={() => navigate(`/${slug}/chat/${conv._id}`)}
                    >
                        <div className={styles.avatar}>
                            {conv.sellerId?.logo ? (
                                <img
                                    src={conv.sellerId.logo}
                                    alt={conv.sellerId?.businessName || "Store"} // FIX: Added safety chaining fallback
                                    className={styles.avatarImg}
                                />
                            ) : (
                                <span className={styles.avatarIcon}>🛍️</span>
                            )}
                        </div>

                        <div className={styles.rowInfo}>
                            <div className={styles.rowTop}>
                                <p className={styles.productName}>
                                    {conv.productId?.name || "Order"}
                                </p>
                                <p className={styles.time}>
                                    {formatTime(conv.updatedAt)}
                                </p>
                            </div>
                            <div className={styles.rowBottom}>
                                <p className={styles.lastMessage}>
                                    {conv.lastMessage || "Order started"}
                                </p>
                                {renderBadge(conv.status)}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button
                    className={styles.backBtn}
                    onClick={() => navigate(`/${slug}`)}
                >
                    ← Store
                </button>
                <p className={styles.title}>My Orders</p>
                <button
                    className={styles.dashboardBtn}
                    onClick={() => {
                        const email = getSavedEmail();
                        if (email) {
                            navigate("/my-orders");
                        } else {
                            navigate("/");
                        }
                    }}
                >
                    Dashboard
                </button>
            </div>

            {renderContent()}
        </div>
    );
};

const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return "Just now"; // Safety fallback for clock variations

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60)); // Standardized clean integers up front
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[date.getDay()];
    }
    return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

export default BuyerOrdersPage;
