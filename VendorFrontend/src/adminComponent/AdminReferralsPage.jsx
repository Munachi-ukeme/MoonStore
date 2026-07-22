import { useState, useEffect } from "react";
import { getAllReferralsAdmin, markCommissionPaidAdmin } from "../api/api";
import styles from "./AdminReferralsPage.module.css";

const AdminReferralsPage = () => {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const loadReferrals = async () => {
        setLoading(true);
        const data = await getAllReferralsAdmin();
        if (data.error) {
            setError(data.error);
        } else {
            setReferrals(data.referrals || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadReferrals();
    }, []);

    const handleMarkPaid = async (email) => {
        setActionLoading(email);
        await markCommissionPaidAdmin(email);
        await loadReferrals();
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

    if (loading) return <p className={styles.stateText}>Loading referrals...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Referrals ({referrals.length})</h1>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Commission Owed</th>
                            <th>Referrer</th>
                            <th>Referred Seller</th>
                            <th>Joined</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {referrals.map((ref, index) => (
                            <tr key={index}>
                                <td>₦{ref.referrerCommissionBalance?.toLocaleString() || 0}</td>
                                <td>
                                    <p className={styles.bizName}>{ref.referrer}</p>
                                    <p className={styles.subText}>{ref.referrerEmail}</p>
                                </td>
                                <td>
                                    <p className={styles.bizName}>{ref.referredSeller}</p>
                                    <p className={styles.subText}>{ref.referredEmail}</p>
                                </td>
                                <td>{formatDate(ref.joinedDate)}</td>
                                <td>
                                    <button
                                        className={styles.markPaidBtn}
                                        disabled={actionLoading === ref.referrerEmail}
                                        onClick={() => handleMarkPaid(ref.referrerEmail)}
                                    >
                                        Mark Commission Paid
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminReferralsPage;