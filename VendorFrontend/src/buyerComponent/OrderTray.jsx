import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { startConversation } from "../api/api";
import { grossUpPrice } from "../utils/pricing";
import { getOrCreateSessionId } from "../utils/session";
import styles from "./OrderTray.module.css";

const TRAY_KEY = (slug) => `moonstore_order_${slug}`;

const OrderTray = ({ slug }) => {
    const navigate = useNavigate();
    const [tray, setTray] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [ordering, setOrdering] = useState(false);
    const [orderError, setOrderError] = useState("");

    const [savedEmail, setSavedEmail] = useState("");
    const [emailInput, setEmailInput] = useState("");

    useEffect(() => {
        const existing = localStorage.getItem("moonstore_buyer_email");
        if (existing) {
            setSavedEmail(existing);
        }
    }, []);

    const handleSaveEmail = () => {
        const trimmed = emailInput.trim();
        if (!trimmed || !trimmed.includes("@")) {
            setOrderError("Please enter a valid email.");
            setTimeout(() => setOrderError(""), 3000);
            return;
        }
        localStorage.setItem("moonstore_buyer_email", trimmed);
        setSavedEmail(trimmed);
    };

    const loadTray = useCallback(() => {
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
    }, [slug]);

    useEffect(() => {
        loadTray();
        window.addEventListener("storage", loadTray);
        return () => window.removeEventListener("storage", loadTray);
    }, [loadTray]);

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

        if (!savedEmail) {
            setOrderError("Please add your email above before ordering.");
            setTimeout(() => setOrderError(""), 3000);
            return;
        }

        setOrdering(true);
        setOrderError("");

        try {
            const sessionId = getOrCreateSessionId();

            const data = await startConversation(
                slug,
                sessionId,
                tray.items,
                tray.buyerName,
                savedEmail,
                tray.deliveryAddress,
                tray.deliveryCity,
                tray.deliveryPhone,
            );

            if (data?.error) {
                setOrderError("Could not start order. Please try again.");
                setTimeout(() => setOrderError(""), 3000);
                setOrdering(false);
                return;
            }

            localStorage.removeItem(TRAY_KEY(slug));
            navigate(`/${slug}/chat/${data.conversation._id}`);

        } catch (error) {
            console.error("Order failed:", error);
            setOrderError("Network error. Please try again.");
            setTimeout(() => setOrderError(""), 3000);
            setOrdering(false);
        }
    };

    if (!tray || !tray.items || tray.items.length === 0) return null;

    const total = tray.items.reduce((sum, item) => sum + grossUpPrice(item.price) * item.quantity, 0);
    const itemCount = tray.items.length;

    return (
        <div className={styles.trayWrapper}>
            <div className={styles.tray}>
            {!expanded ? (
                <div className={styles.collapsed} onClick={() => setExpanded(true)}>
                    <span className={styles.collapsedText}>
                        {itemCount} {itemCount === 1 ? "item" : "items"} · ₦{total.toLocaleString()}
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
    {item.colors && item.colors.length > 0 ? ` · ${item.colors.join(", ")}` : ""}
    {item.sizes && item.sizes.length > 0 ? ` · Size: ${item.sizes.join(", ")}` : ""}
</p>
                                   <p className={styles.itemPrice}>
                                        ₦{(grossUpPrice(item.price) * item.quantity).toLocaleString()}
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

                    {!savedEmail ? (
                        <div className={styles.emailBanner}>
                            <p className={styles.emailBannerText}>
                                Email required — used to verify your order and payment
                            </p>
                            <div className={styles.emailBannerRow}>
                                <input
                                    type="email"
                                    className={styles.emailBannerInput}
                                    placeholder="you@email.com"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                />
                                <button
                                    className={styles.emailBannerSaveBtn}
                                    onClick={handleSaveEmail}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className={styles.emailBannerSaved}>Ordering as {savedEmail}</p>
                    )}

                    {orderError ? (
                        <p className={styles.orderError}>{orderError}</p>
                    ) : null}

                    <button
                        className={styles.startOrderBtn}
                        onClick={handleStartOrder}
                        disabled={ordering || !savedEmail}
                    >
                        {ordering ? "Sending order..." : "Send your Order →"}
                    </button>
                </div>
            )}
        </div>

        </div>
    );
};

export default OrderTray;