import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getSellerInbox } from "../api/api";
import styles from "./SellerInboxPage.module.css";

const SellerInboxPage = () => {
  const { seller } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInbox = async () => {
      const data = await getSellerInbox();
      if (data.error) {
        setError("Could not load inbox.");
      } else {
        setConversations(data.conversations);
      }
      setLoading(false);
    };
    fetchInbox();
  }, []);

  const filtered = conversations.filter((c) => {
    if (filter === "all") return true;
    if (filter === "active") return c.status === "active";
    if (filter === "paid") return c.status === "paid";
    return true;
  });

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

  if (loading) return <div className={styles.loading}>Loading inbox...</div>;
  if (error) return <div className={styles.error}>{error}</div>;


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
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>No conversations yet.</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((c) => {
            const unread = isUnread(c);
            return (
              <div
                key={c._id}
                className={`${styles.item} ${unread ? styles.unread : ""}`}
                onClick={() => openThread(c._id)}
              >
                 <div className={styles.avatar}>
                  {c.productId?.name?.charAt(0).toUpperCase() || "?"}
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
                      {c.status === "paid" && (
                        <span className={styles.paidBadge}>Paid</span>
                      )}
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