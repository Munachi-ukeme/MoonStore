import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getProducts } from "../api/api";
import styles from "./DashboardPage.module.css";
import AnalyticsSection from "./AnalyticsSection";

function DashboardPage() {
    const { seller } = useAuth();
    const referralLink = `moonstore.com/signup?ref=${seller?.referralCode}`;
    const storeLink = `moonstore.com/${seller?.slug}`;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);

    // fetch products when page loads
    useEffect(() => {
        const loadProducts = async () => {
            const data = await getProducts();

            if (data.error) {
                setError(data.error);
                setLoading(false);
                return;
            }

            setProducts(data);
            setLoading(false);
        };
        loadProducts();
    }, []);

    // plan product limit
    let productLimit;
    if (seller?.plan === "basic") {
        productLimit = 25;
    } else if (seller?.plan === "pro") {
        productLimit = 60;
    } else if (seller?.plan === "premium") {
        productLimit = null;
    } else {
        productLimit = 25;
    }

    // copy store link
    const handleCopyLink = () => {
        navigator.clipboard.writeText(storeLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // copy referral link
    const handleCopyReferral = () => {
        navigator.clipboard.writeText(referralLink);
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2000);
    };

    // visit store in new tab
    const visitStore = () => {
        window.open(`https://${storeLink}`, "_blank");
    };

    return (
        <div className={styles.container}>

            {/* welcome row */}
            <div className={styles.welcomeContainer}>
                <div className={styles.welcome}>
                    <h1 className={styles.welcomeTitle}>
                        Hi, {seller?.businessName}
                    </h1>
                    <p className={
                        seller?.isActive
                            ? styles.activeStatus
                            : styles.inactiveStatus
                    }>
                        {seller?.isActive
                            ? "Your store is live"
                            : "Your store is inactive"}
                    </p>
                </div>

                <button className={styles.visitStore} onClick={visitStore}>
                    Visit Store
                </button>
            </div>

            {/* error message */}
            {error && <p className={styles.error}>{error}</p>}

            {/* loading state */}
            {loading ? (
                <p className={styles.loading}>Loading your store data...</p>
            ) : null}

            {/* store link card */}
            {loading ? null : (
                <div className={styles.heroCard}>
                    <p className={styles.heroLabel}>Your Store Link</p>
                    <div className={styles.storeLinkRow}>
                        <button
                            className={styles.copyButton}
                            onClick={handleCopyLink}
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                    <p className={styles.storeLinkHint}>
                        Your store link is permanent. It will not change if you update your store name.
                    </p>
                </div>
            )}

            {/* stats cards */}
            {loading ? null : (
                <div className={styles.cards}>
                    <div className={styles.card}>
                        <p className={styles.cardLabel}>Products</p>
                        <p className={styles.cardValue}>
                            {products.length}
                            {productLimit !== null ? ` / ${productLimit}` : " / ∞"}
                        </p>
                        <p className={styles.cardHint}>
                            {productLimit !== null
                                ? `${productLimit - products.length} slots left`
                                : "No product limit"}
                        </p>
                    </div>

                    <div className={styles.card}>
                        <p className={styles.cardLabel}>Your Plan</p>
                        <p className={styles.cardValue}>{seller?.plan}</p>
                        <p className={styles.cardHint}>
                            {seller?.plan === "basic" ? "Upgrade for more features" : null}
                            {seller?.plan === "pro" ? "Upgrade to Premium" : null}
                            {seller?.plan === "premium" ? "You are on the best plan" : null}
                        </p>
                    </div>
                </div>
            )}

            {/* referral card */}
            <div className={styles.referralCard}>
                <p className={styles.heroLabel}>Earn ₦3,000 Per Referral</p>
                <div className={styles.storeLinkRow}>
                    <button
                        className={styles.copyButton}
                        onClick={handleCopyReferral}
                    >
                        {copiedReferral ? "Copied!" : "Copy"}
                    </button>
                </div>

                {/* commission stats */}
                <div className={styles.commissionRow}>
                    <div className={styles.commissionItem}>
                        <p className={styles.commissionLabel}>Total Earned</p>
                        <p className={styles.commissionValue}>
                            ₦{seller?.totalEarned?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className={styles.commissionItem}>
                        <p className={styles.commissionLabel}>Pending</p>
                        <p className={styles.commissionValue}>
                            ₦{seller?.commissionBalance?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className={styles.commissionItem}>
                        <p className={styles.commissionLabel}>Paid Out</p>
                        <p className={styles.commissionValue}>
                            ₦{seller?.totalPaid?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* basic analytics - pro and premium only */}
            {seller ? (
                < AnalyticsSection />
            ) : null}

            {/* advanced sales insights - premium only */}
            {seller?.plan === "premium" ? (
                <div className={styles.comingSoonCard}>
                    <p className={styles.comingSoonLabel}>Advanced Sales Insights</p>
                    <p className={styles.comingSoonTitle}>Coming Soon</p>
                    <p className={styles.comingSoonText}>
                        Get specific advice on what to do to increase your orders.
                    </p>
                </div>
            ) : null}
        </div>
    );
}

export default DashboardPage;