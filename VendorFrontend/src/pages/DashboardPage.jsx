import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getProducts } from "../api/api";
import styles from "./DashboardPage.module.css";
import AnalyticsSection from "./AnalyticsSection";

function DashboardPage() {
    const { seller, updateSeller } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); 

    const referralLink = `https://moonstore.ng/register?ref=${seller?.referralCode}`;
    const storeLink = `moonstore.ng/${seller?.slug}`;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);

    const isInactive = !seller?.isActive;

    // PAYSTACK SUBSCRIPTION SYNC EFFECT
useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const hasPaystackRef = queryParams.get("reference");

    if (hasPaystackRef) {
        const fetchFreshUserSession = async () => {
            try {
                const response = await fetch("/api/payments/sync-subscription", {
                    headers: {
                        
                        "Authorization": `Bearer ${localStorage.getItem("token")}` 
                    }
                });
                const data = await response.json();

                if (response.ok) {
                    
                    updateSeller(data.seller);
                    
                    window.history.replaceState({}, document.title, "/dashboard");
                    
                    console.log("Welcome to your new plan!");
                }
            } catch (err) {
                console.error("Failed syncing subscription", err);
            }
        };

        fetchFreshUserSession();
    }
}, [location, updateSeller]);

 

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
        if (isInactive) return;
        navigator.clipboard.writeText(storeLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // copy referral link
    const handleCopyReferral = () => {
        if (isInactive) return;
        navigator.clipboard.writeText(referralLink);
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2000);
    };

    // visit store in new tab
    const visitStore = () => {
        if (isInactive) return;
        window.open(`https://${storeLink}`, "_blank");
    };

    //activate button
     const handleActivateNow = () => {
        setShowWelcomePopup(false);
        navigate("/dashboard/settings");
    };

    return (
        <div className={styles.container}>

         {/* welcome popup for new sellers */}
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
                            Your 7-day free trial is live. Here's how to get the most out of it before you start selling:
                        </p>
                        <div className={styles.popupSteps}>
                            <p className={styles.popupStep}>1. Go to Settings and finish setting up your store, add your logo, tagline, and banner</p>
                            <p className={styles.popupStep}> 2. Turn on email notifications so you never miss an order alert</p>
                            <p className={styles.popupStep}> 3. Paste your product links whenever you post online, so buyers can order directly on your site instead of messaging you</p>
                            
                        </div>
                        <button
                            className={styles.popupActivateBtn}
                            onClick={handleActivateNow}
                        >
                            Go to Settings
                        </button>
                    </div>
                </div>
            ) : null}


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

             {/* inactive notice bar */}
            {isInactive ? (
                <div className={styles.inactiveBar}>
                    Your store is inactive. Activate to unlock all features.
                    <button
                        className={styles.inactiveBarBtn}
                        onClick={() => navigate("/dashboard/settings")}
                    >
                        Activate Now
                    </button>
                </div>
            ) : null}

            {/* error message */}
            {error ? (
          <div className={styles.errorRow}>
           <p className={styles.error}>{error}</p>
           <button className={styles.retryBtn} onClick={loadProducts}>
            Try Again
           </button>
           </div>
            ) : null}

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