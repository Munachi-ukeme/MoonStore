import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getProducts, getCategories } from "../api/api";
import styles from "./DashboardPage.module.css";
import AnalyticsSection from "./AnalyticsSection";

function DashboardPage() {
    const { seller } = useAuth();
    const navigate = useNavigate();

    const referralLink = `https://moonstore.ng/register?ref=${seller?.referralCode || ""}`;
    const storeLink = `moonstore.ng/${seller?.slug || ""}`;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);

    const isInactive = !seller?.isActive;

    // First-time seller welcome modal check
    useEffect(() => {
        if (!seller?._id) return;

        const welcomeKey = `moonstore_welcome_seen_${seller._id}`;
        const hasSeenWelcome = localStorage.getItem(welcomeKey);

        if (!hasSeenWelcome) {
            setShowWelcomePopup(true);
            localStorage.setItem(welcomeKey, "true");
        }
    }, [seller]);

    const loadProducts = async () => {
        setError(null);
        setLoading(true);
        const data = await getProducts();

        if (data.error) {
            setError(data.error);
            setLoading(false);
            return;
        }

        setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const loadCategories = async () => {
        setError(null);
        setLoading(true);
        const data = await getCategories();

        if (data.error) {
            setError(data.error);
            setLoading(false);
            return;
        }

        setCategories(data);
        setLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleCopyLink = () => {
        if (isInactive) return;
        navigator.clipboard.writeText(storeLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyReferral = () => {
        if (isInactive) return;
        navigator.clipboard.writeText(referralLink);
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2000);
    };

    const visitStore = () => {
        if (isInactive) return;
        window.open(`https://${storeLink}`, "_blank");
    };

    const handleGoToSettingsNow = () => {
        setShowWelcomePopup(false);
        navigate("/dashboard/settings");
    };

    return (
        <div className={styles.container}>
            {/* Welcome Popup for New Sellers */}
            {showWelcomePopup ? (
                <div className={styles.popupOverlay}>
                    <div className={styles.popup}>
                        <button
                            className={styles.popupClose}
                            onClick={() => setShowWelcomePopup(false)}
                        >
                            ✕
                        </button>
                        <div className={styles.popupIcon}>MoonStore</div>
                        <h2 className={styles.popupTitle}>
                            Welcome to MoonStore, {seller?.businessName}!
                        </h2>
                        <p className={styles.popupText}>
                            Your store is live. Here is how to get ready to receive your first order:
                        </p>
                        <div className={styles.popupSteps}>
                            <p className={styles.popupStep}>
                                1. Go to Settings and finish setting up your store, add your logo, tagline, banner, etc
                            </p>

                            <p className={styles.popupStep}> 2. Turn on email notifications so you never miss an order alert</p>

                            <p className={styles.popupStep}> 3. Add your Categories with clean names</p>

                            <p className={styles.popupStep}>
                                4. Add your products with clean titles, clear images, and accurate pricing
                            </p>

                            <p className={styles.popupStep}> 5. Paste the product link together with the product whenever you post online, so buyers can order directly on your site instead of messaging you</p>

                            <p className={styles.popupStep}>
                                5. Share your store link on social media so buyers can purchase directly from you
                            </p>
                        </div>
                        <button
                            className={styles.popupActivateBtn}
                            onClick={handleGoToSettingsNow}
                        >
                            Go to Settings
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Header Row */}
            <div className={styles.welcomeContainer}>
                <div className={styles.welcome}>
                    <h1 className={styles.welcomeTitle}>
                        Hi, {seller?.businessName || "Seller"}
                    </h1>
                    <p
                        className={
                            seller?.isActive
                                ? styles.activeStatus
                                : styles.inactiveStatus
                        }
                    >
                        {seller?.isActive
                            ? "Your store is live"
                            : "Your store is inactive"}
                    </p>
                </div>

                <button className={styles.visitStore} onClick={visitStore}>
                    Visit Store
                </button>
            </div>

            {/* Inactive Notice Bar */}
            {isInactive ? (
                <div className={styles.inactiveBar}>
                    Your store is inactive. Please contact support to fix it.
                    
                </div>
            ) : null}

            {/* Error Message */}
            {error ? (
                <div className={styles.errorRow}>
                    <p className={styles.error}>{error}</p>
                    <button className={styles.retryBtn} onClick={loadProducts}>
                        Try Again
                    </button>
                </div>
            ) : null}

            {/* Loading State */}
            {loading ? (
                <p className={styles.loading}>Loading your store data...</p>
            ) : null}

            {/* Store Link Card */}
            {!loading && (
                <div className={styles.heroCard}>
                    <p className={styles.heroLabel}>Your Store Link</p>
                    <div className={styles.storeLinkRow}>
                        
                        <button
                            className={styles.copyButton}
                            onClick={handleCopyLink}
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                        <p className={styles.cardHint}>
                Share this link on your social bio and messaging apps to direct customers to your store.
              </p>
                    </div>
                
                </div>
            )}

            {/* Stats Cards */}
            {!loading && (
                <div className={styles.cards}>
                    <div className={styles.card}>
                        <p className={styles.cardLabel}>Active Products</p>
                        <p className={styles.cardValue}>{products.length}</p>
                        <p className={styles.cardHint}>Total items listed in store</p>
                    </div>

                    <div className={styles.card}>
            <p className={styles.cardLabel}>Categories</p>
            <p className={styles.cardValue}>{categories.length}</p>
            <p className={styles.cardHint}>Active store categories</p>
        </div>
                </div>
            )}

            {/* Analytics Overview */}
            {seller ? <AnalyticsSection /> : null}

            {/* Referral Program Card */}
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

            
        </div>
    );
}

export default DashboardPage;