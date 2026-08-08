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

    const [showEmailBanner, setShowEmailBanner] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [emailSaved, setEmailSaved] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem("moonstore_buyer_email");
        const dismissed = localStorage.getItem("moonstore_email_banner_dismissed");

        if (!savedEmail && !dismissed) {
            setShowEmailBanner(true);
        }
    }, []);

    const handleSaveEmail = () => {
        if (!emailInput.trim()) return;
        localStorage.setItem("moonstore_buyer_email", emailInput.trim());
        setEmailSaved(true);
        setTimeout(() => {
            setShowEmailBanner(false);
        }, 1200);
    };

    const handleDismissBanner = () => {
        localStorage.setItem("moonstore_email_banner_dismissed", "true");
        setShowEmailBanner(false);
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
        setOrdering(true);
        setOrderError("");

        try {
            const sessionId = getOrCreateSessionId();
            const buyerEmail = localStorage.getItem("moonstore_buyer_email") || "";

            const data = await startConversation(
                slug,
                sessionId,
                tray.items,
                tray.buyerName,
                buyerEmail,
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

            // clear tray after successful order
            localStorage.removeItem(TRAY_KEY(slug));
            localStorage.removeItem("moonstore_email_banner_dismissed");
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
            {showEmailBanner ? (
                <div className={styles.emailBanner}>
                    {emailSaved ? (
                        <p className={styles.emailBannerSaved}>Email saved ✓</p>
                    ) : (
                        <div className={styles.emailBannerContent}>
                            <p className={styles.emailBannerText}>
                                Add your email so you don't miss order replies
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
                                <button
                                    className={styles.emailBannerDismissBtn}
                                    onClick={handleDismissBanner}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            <div className={styles.tray}>
            {/* collapsed bar */}
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

                    {orderError ? (
                        <p className={styles.orderError}>{orderError}</p>
                    ) : null}

                    <button
                        className={styles.startOrderBtn}
                        onClick={handleStartOrder}
                        disabled={ordering}
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