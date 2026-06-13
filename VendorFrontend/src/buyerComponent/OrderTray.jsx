import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startConversation } from "../api/api";
import { getOrCreateSessionId } from "../utils/session";
import styles from "./OrderTray.module.css";

const TRAY_KEY = (slug) => `moonstore_order_${slug}`;

const OrderTray = ({ slug }) => {
    const navigate = useNavigate();
    const [tray, setTray] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [ordering, setOrdering] = useState(false);
    const [orderError, setOrderError] = useState("");

    const loadTray = () => {
        try {
            const existing = localStorage.getItem(TRAY_KEY(slug));
            if (existing) {
                const parsed = JSON.parse(existing);
                if (parsed.items && parsed.items.length > 0) {
                    setTray(parsed);
                    return;
                }
            }
            setTray(null);
        } catch {
            setTray(null);
        }
    };

    useEffect(() => {
        loadTray();
        // listen for storage changes so tray updates when item added
        window.addEventListener("storage", loadTray);
        return () => window.removeEventListener("storage", loadTray);
    }, [slug]);

    // also reload when component mounts fresh after navigation
    useEffect(() => {
        loadTray();
    });

    const handleRemoveItem = (index) => {
        try {
            const existing = localStorage.getItem(TRAY_KEY(slug));
            if (!existing) return;
            const parsed = JSON.parse(existing);
            parsed.items.splice(index, 1);
            if (parsed.items.length === 0) {
                localStorage.removeItem(TRAY_KEY(slug));
                setTray(null);
            } else {
                localStorage.setItem(TRAY_KEY(slug), JSON.stringify(parsed));
                setTray({ ...parsed });
            }
        } catch {
            // ignore
        }
    };

    const handleStartOrder = async () => {
        if (!tray || !tray.items.length) return;
        setOrdering(true);
        setOrderError("");

        const sessionId = getOrCreateSessionId();

        const data = await startConversation(
            slug,
            sessionId,
            tray.items,
            tray.buyerName,
            tray.deliveryAddress,
            tray.deliveryCity,
            tray.deliveryPhone,
        );

        setOrdering(false);

        if (data.error) {
            setOrderError("Could not start order. Please try again.");
            setTimeout(() => setOrderError(""), 3000);
            return;
        }

        // clear tray after successful order
        localStorage.removeItem(TRAY_KEY(slug));
        navigate(`/${slug}/chat/${data.conversation._id}`);
    };

    if (!tray || !tray.items || tray.items.length === 0) return null;

    const total = tray.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = tray.items.length;

    return (
        <div className={styles.tray}>
            {/* collapsed bar */}
            {!expanded ? (
                <div className={styles.collapsed} onClick={() => setExpanded(true)}>
                    <span className={styles.collapsedText}>
                        🛍️ {itemCount} {itemCount === 1 ? "item" : "items"} · ₦{total.toLocaleString()}
                    </span>
                    <button className={styles.orderNowBtn}>
                        Order →
                    </button>
                </div>
            ) : (
                <div className={styles.expanded}>
                    <div className={styles.expandedHeader}>
                        <span className={styles.expandedTitle}>Your Order</span>
                        <button className={styles.collapseBtn} onClick={() => setExpanded(false)}>
                            ▼
                        </button>
                    </div>

                    <div className={styles.itemList}>
                        {tray.items.map((item, index) => (
                            <div key={index} className={styles.item}>
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.productName}
                                        className={styles.itemImage}
                                    />
                                ) : null}
                                <div className={styles.itemInfo}>
                                    <p className={styles.itemName}>{item.productName}</p>
                                    <p className={styles.itemMeta}>
                                        x{item.quantity}
                                        {item.color ? ` · ${item.color}` : ""}
                                        {item.size ? ` · Size: ${item.size}` : ""}
                                    </p>
                                    <p className={styles.itemPrice}>
                                        ₦{(item.price * item.quantity).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => handleRemoveItem(index)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Total</span>
                        <span className={styles.totalValue}>₦{total.toLocaleString()}</span>
                    </div>

                    {orderError ? (
                        <p className={styles.orderError}>{orderError}</p>
                    ) : null}

                    <button
                        className={styles.startOrderBtn}
                        onClick={handleStartOrder}
                        disabled={ordering}
                    >
                        {ordering ? "Starting order..." : "Start Order →"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrderTray;