import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buyerLogin } from "../api/api";
import { saveBuyerEmailLocally } from "../utils/session";
import styles from "./HomePage.module.css";

const HomePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("buyer");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

      const handleTrackOrders = async () => {
        setError("");
        if (!email.trim()) {
            setError("Please enter your email");
            return;
        }

        setLoading(true);
        const result = await buyerLogin(email.trim());
        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }


        // save email and all session IDs locally so buyer is recognised
        // across the platform
        saveBuyerEmailLocally(email.trim());

        // store all sessionIds from backend — buyer may have used
        // multiple devices before saving email
        localStorage.setItem("moonstore_session_ids", JSON.stringify(result.sessionIds));

        navigate("/my-orders");
    };

     const handleTabSwitch = (tab) => {
        setError("");
        setEmail("");
        setActiveTab(tab);
    };

    const renderBuyerTab = () => {
        return (
            <div className={styles.tabContent}>
                <div className={styles.contentTop}>
                    <p className={styles.contentTitle}>Track Your Orders</p>
                    <p className={styles.contentText}>
                        Enter the email you saved while shopping to see all your
                        orders and chat history.
                    </p>
                </div>

                <div className={styles.inputGroup}>
                    <input
                        className={styles.input}
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {error ? <p className={styles.error}>{error}</p> : null}
                    <button
                        className={styles.primaryBtn}
                        onClick={handleTrackOrders}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Track My Orders →"}
                    </button>
                </div>

                <p className={styles.hint}>
                    No account needed — just the email you used while shopping.
                </p>
            </div>
        );
    };


     const renderSellerTab = () => {
        return (
            <div className={styles.tabContent}>
                <div className={styles.contentTop}>
                    <p className={styles.contentTitle}>Your own branded online store in 3 minutes.</p>
                    <p className={styles.contentText}>
                        Buyers browse your products, chat with you and pay. All inside your store. No WhatsApp stress. No marketplace.
                    </p>
                </div>

                <div className={styles.perks}>
                    <p className={styles.perk}>✓ Your store. Your name. Your brand.</p>
                    <p className={styles.perk}>✓ Buyers chat and pay inside your store</p>
                    <p className={styles.perk}>✓ Money sent to your bank daily</p>
                    <p className={styles.perk}>✓ No tech skills. No developer. No stress.</p>
                </div>

                <button
                    className={styles.primaryBtn}
                    onClick={() => navigate("/register")}
                >
                    Get Your Store →
                </button>

                <button
                    className={styles.ghostBtn}
                    onClick={() => navigate("/login")}
                >
                    Already have a store? Log in
                </button>
            </div>
        );
    };

    return (
        <div className={styles.page}>
            {/* brand */}
            <div className={styles.brand}>
                <h1 className={styles.logo}>MoonStore</h1>
                <p className={styles.tagline}>Africa's vendor platform</p>
            </div>

            {/* toggle tabs */}
            <div className={styles.tabs}>
                <button
                    className={
                        activeTab === "buyer"
                            ? `${styles.tab} ${styles.activeTab}`
                            : styles.tab
                    }
                    onClick={() => handleTabSwitch("buyer")}
                >
                    I'm Shopping
                </button>
                <button
                    className={
                        activeTab === "seller"
                            ? `${styles.tab} ${styles.activeTab}`
                            : styles.tab
                    }
                    onClick={() => handleTabSwitch("seller")}
                >
                    I'm a Vendor
                </button>
            </div>

            {/* content */}
            <div className={styles.card}>
                {activeTab === "buyer" ? renderBuyerTab() : renderSellerTab()}
            </div>

            <p className={styles.footer}>
                MoonStore · Your Store. Your Rules.
            </p>
        </div>
    );
};

export default HomePage;