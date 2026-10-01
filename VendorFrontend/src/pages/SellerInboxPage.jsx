import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSellerInbox } from "../api/api";
import styles from "./SellerInboxPage.module.css";

const SellerInboxPage = () => {
  const { seller } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInbox = useCallback(async () => {
    setError("");
    setLoading(true);
    const data = await getSellerInbox();
    if (data.error) {
      setError("Could not load inbox.");
    } else {
      setConversations(data.conversations);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const filtered = conversations?.filter((c) => {
    if (filter === "all") return true;
    if (filter === "active") return c.orderStage === "awaiting_payment";
    if (filter === "paid") return c.orderStage === "payment_held";
    if (filter === "shipped") return c.orderStage === "shipped";
    if (filter === "delivered") return c.orderStage === "delivered";
    if (filter === "released") return c.orderStage === "released";
    if (filter === "disputed") return c.orderStage === "disputed";
    if (filter === "refunded") return c.orderStage === "refunded";
    return true;
  }) || [];

  const openThread = (conversationId) => {
    navigate(`/dashboard/chat/${conversationId}`);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    return date.toLocaleDateString();
  };

  const isUnread = (c) => {
    if (c.status === "paid") return false;
    if (!c.buyerLastMessageAt) return false;
    if (!c.sellerLastReadAt) return true;
    return new Date(c.buyerLastMessageAt) > new Date(c.sellerLastReadAt);
  };

  const stageBadgeText = (stage) => {
    if (stage === "payment_held") return "Paid";
    if (stage === "shipped") return "Shipped";
    if (stage === "delivered") return "Delivered";
    if (stage === "released") return "Completed";
    if (stage === "disputed") return "Disputed";
    if (stage === "refunded") return "Refunded";
    return null;
  };

  if (loading) return <div className={styles.loading}>Loading inbox...</div>;

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button className={styles.retryBtn} onClick={fetchInbox}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Inbox</h1>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "active" ? styles.active : ""}`}
          onClick={() => setFilter("active")}
        >
          Active
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "paid" ? styles.active : ""}`}
          onClick={() => setFilter("paid")}
        >
          Paid
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "shipped" ? styles.active : ""}`}
          onClick={() => setFilter("shipped")}
        >
          Shipped
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "delivered" ? styles.active : ""}`}
          onClick={() => setFilter("delivered")}
        >
          Delivered
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "released" ? styles.active : ""}`}
          onClick={() => setFilter("released")}
        >
          Completed
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "disputed" ? styles.active : ""}`}
          onClick={() => setFilter("disputed")}
        >
          Disputed
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "refunded" ? styles.active : ""}`}
          onClick={() => setFilter("refunded")}
        >
          Refunded
        </button>
      </div>

      {filtered?.length === 0 ? (
        <div className={styles.empty}>No conversations yet.</div>
      ) : (
        <div className={styles.list}>
          {filtered?.map((c) => {
            const unread = isUnread(c);
            const badgeText = stageBadgeText(c.orderStage);
            return (
              <div
                key={c._id}
                className={`${styles.item} ${unread ? styles.unread : ""}`}
                onClick={() => openThread(c._id)}
              >
                <div className={styles.avatar}>
                  {c.productId?.name?.charAt(0).toUpperCase() || "🛍️"}
                </div>
                <div className={styles.info}>
                  <div className={styles.topRow}>
                    <span className={styles.productName}>
                      {c.productId?.name || "Product"}
                    </span>
                    <span className={styles.time}>{formatTime(c.updatedAt)}</span>
                  </div>
                  <div className={styles.bottomRow}>
                    <span className={styles.preview}>
                      {c.lastMessage || "No messages yet"}
                    </span>
                    <div className={styles.badges}>
                      {badgeText ? (
                        <span className={styles.paidBadge}>{badgeText}</span>
                      ) : null}
                      {unread && <span className={styles.dot} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerInboxPage;