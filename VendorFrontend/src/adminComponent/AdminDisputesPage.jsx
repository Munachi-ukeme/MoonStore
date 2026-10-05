import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDisputedConversationsAdmin } from "../api/api";
import styles from "./AdminDisputesPage.module.css";

const AdminDisputesPage = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const loadDisputes = async () => {
            const data = await getDisputedConversationsAdmin();
            if (data.error) {
                setError(data.error);
            } else {
                setDisputes(data.disputes || []);
            }
            setLoading(false);
        };
        loadDisputes();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-NG", {
            day: "numeric", month: "short", year: "numeric",
        });
    };

    if (loading) return <p className={styles.stateText}>Loading disputes...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;

    if (disputes.length === 0) {
        return <p className={styles.stateText}>No active disputes.</p>;
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Disputed Orders ({disputes.length})</h1>

            <div className={styles.list}>
                {disputes.map((d) => (
                    <div
                        key={d._id}
                        className={styles.card}
                        onClick={() => navigate(`/admin/disputes/${d._id}`)}
                    >
                        <div className={styles.cardHeader}>
                            <p className={styles.sellerName}>
                                {d.sellerId?.businessName || "Unknown seller"}
                            </p>
                            <span className={styles.disputedBadge}>Disputed</span>
                        </div>

                        <p className={styles.sellerMeta}>
                            /{d.sellerId?.slug} · {d.sellerId?.email} · {d.sellerId?.whatsappNumber}
                        </p>

                        <p className={styles.reason}>Reason: {d.dispute?.reason || "Not specified"}</p>

                        <p className={styles.buyerMeta}>
                            Buyer: {d.buyerName || "—"} · {d.buyerEmail || "no email"} · Amount: ₦{d.amount?.toLocaleString()}
                        </p>

                        <p className={styles.date}>Raised: {formatDate(d.dispute?.raisedAt)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDisputesPage;