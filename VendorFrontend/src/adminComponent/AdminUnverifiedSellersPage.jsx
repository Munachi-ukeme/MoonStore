import { useState, useEffect } from "react";
import { getUnverifiedSellersAdmin, verifySubaccountAdmin } from "../api/api";
import styles from "./AdminUnverifiedSellersPage.module.css";

const AdminUnverifiedSellersPage = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const loadSellers = async () => {
        setLoading(true);
        const data = await getUnverifiedSellersAdmin();
        if (data.error) {
            setError(data.error);
        } else {
            setSellers(data.sellers || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadSellers();
    }, []);

    const handleVerify = async (email, businessName) => {
        const confirmed = window.confirm(
            `Confirm ${businessName}'s Paystack subaccount is verified? This unlocks Products and Categories for them.`
        );
        if (!confirmed) return;

        setActionLoading(email);
        await verifySubaccountAdmin(email);
        await loadSellers();
        setActionLoading(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) return <p className={styles.stateText}>Loading unverified sellers...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Unverified Sellers ({sellers.length})</h1>
            <p className={styles.subtitle}>
                Verify each seller's Paystack subaccount directly on your Paystack
                dashboard, then unlock them here.
            </p>

            {sellers.length === 0 ? (
                <p className={styles.stateText}>All sellers are verified. Nothing pending.</p>
            ) : (
                <div className={styles.list}>
                    {sellers.map((seller) => (
                        <div key={seller.email} className={styles.card}>
                            <div className={styles.cardTop}>
                                <p className={styles.bizName}>{seller.businessName}</p>
                                <p className={styles.slugText}>/{seller.slug}</p>
                            </div>

                            <p className={styles.meta}>{seller.email} · {seller.whatsappNumber}</p>

                            <p className={styles.meta}>
                                Bank: {seller.bankDetails?.bankName || "—"} ·{" "}
                                {seller.bankDetails?.accountNumber || "—"} ·{" "}
                                {seller.bankDetails?.accountName || "—"}
                            </p>

                            <p className={styles.meta}>
                                Subaccount code: {seller.paystackSubaccountCode || "—"}
                            </p>

                            <p className={styles.meta}>Joined: {formatDate(seller.joinedDate)}</p>

                            <button
                                className={styles.verifyBtn}
                                disabled={actionLoading === seller.email}
                                onClick={() => handleVerify(seller.email, seller.businessName)}
                            >
                                {actionLoading === seller.email ? "Verifying..." : "Verify & Unlock"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminUnverifiedSellersPage;