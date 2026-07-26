import { useState, useEffect } from "react";
import { getRevenueSummaryAdmin } from "../api/api";
import DateRangeFilter from "../adminComponent/DateRangeFilter";
import styles from "./AdminRevenuePage.module.css";

const AdminRevenuePage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const handleFilterChange = async (start, end) => {
        setLoading(true);
        const result = await getRevenueSummaryAdmin(start, end);
        if (result.error) {
            setError(result.error);
        } else {
            setData(result);
            setError("");
        }
        setLoading(false);
    };

    useEffect(() => {
        handleFilterChange("", "");
    }, []);

    if (loading) return <p className={styles.stateText}>Loading revenue...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Revenue Overview</h1>

            <div className={styles.filterRow}>
                <DateRangeFilter onChange={(start, end) => handleFilterChange(start, end)} />
            </div>

            <div className={styles.cards}>
                <div className={styles.card}>
                    <p className={styles.cardLabel}>GMV</p>
                    <p className={styles.cardValue}>₦{data?.gmv?.toLocaleString() || 0}</p>
                    <p className={styles.cardHint}>{data?.orderCount || 0} orders</p>
                </div>
                <div className={styles.card}>
                    <p className={styles.cardLabel}>Transaction Fee Revenue</p>
                    <p className={styles.cardValue}>₦{data?.transactionFeeRevenue?.toLocaleString() || 0}</p>
                </div>
                <div className={styles.card}>
                    <p className={styles.cardLabel}>Subscription Revenue</p>
                    <p className={styles.cardValue}>₦{data?.subscriptionRevenue?.toLocaleString() || 0}</p>
                    <p className={styles.cardHint}>{data?.subscriptionCount || 0} payments</p>
                </div>
                <div className={`${styles.card} ${styles.totalCard}`}>
                    <p className={styles.cardLabel}>Total Revenue</p>
                    <p className={styles.cardValue}>₦{data?.totalRevenue?.toLocaleString() || 0}</p>
                </div>
            </div>
        </div>
    );
};

export default AdminRevenuePage;