import { useState, useEffect } from "react";
import { getReportedConversationsAdmin, BASE_URL } from "../api/api";
import styles from "./AdminReportsPage.module.css";

const AdminReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadReports = async () => {
            const data = await getReportedConversationsAdmin();
            if (data.error) {
                setError(data.error);
            } else {
                setReports(data.reports || []);
            }
            setLoading(false);
        };
        loadReports();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-NG", {
            day: "numeric", month: "short", year: "numeric",
        });
    };

    if (loading) return <p className={styles.stateText}>Loading reports...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;

    if (reports.length === 0) {
        return <p className={styles.stateText}>No reported conversations.</p>;
    }

    const handleExportPdf = (conversationId) => {
    const adminToken = localStorage.getItem("moonstore_admin_token");
    const url = `${BASE_URL}/admin/reports/${conversationId}/export`;

    // fetch with auth header, then trigger browser download manually
    fetch(url, { headers: { "admin-key": adminToken } })
        .then((res) => res.blob())
        .then((blob) => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `conversation-${conversationId}.pdf`;
            link.click();
            window.URL.revokeObjectURL(downloadUrl);
        });
};

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Reported Orders ({reports.length})</h1>

            <div className={styles.list}>
                {reports.map((report) => (
                    <div key={report._id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <p className={styles.sellerName}>
                                {report.sellerId?.businessName || "Unknown seller"}
                            </p>
                            <span className={report.sellerId?.isActive ? styles.activeBadge : styles.inactiveBadge}>
                                {report.sellerId?.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>

                        <p className={styles.sellerMeta}>
                            /{report.sellerId?.slug} · {report.sellerId?.email} · {report.sellerId?.whatsappNumber}
                        </p>

                        <p className={styles.reason}>Reason: {report.reportReason || "Not specified"}</p>

                        <p className={styles.buyerMeta}>
                            Buyer: {report.buyerName || "—"} · {report.buyerEmail || "no email"} · {report.buyerPhone || "no phone"} · Amount: ₦{report.amount?.toLocaleString()}
                        </p>

                        <p className={styles.date}>Reported around: {formatDate(report.updatedAt)}</p>

                        <button
    className={styles.exportBtn}
    onClick={() => handleExportPdf(report._id)}
>
    Export Chat as PDF
</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminReportsPage;