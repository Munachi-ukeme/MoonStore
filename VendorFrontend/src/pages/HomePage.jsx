import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestBuyerLoginLink } from "../api/api";
import styles from "./HomePage.module.css";
import StepsSection from "../sellerComponent/StepsSection";
import FAQSection from "../sellerComponent/FAQSection";
import logo from "../assets/logo.png";
const HomePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("seller");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

        const handleSendLoginLink = async () => {
        setError("");
        setInfoMessage("");

        if (!email.trim()) {
            setError("Please enter your email");
            return;
        }

        setLoading(true);
        const result = await requestBuyerLoginLink(email.trim());
        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        setInfoMessage(result.message);
    };

    const handleTabSwitch = (tab) => {
        setError("");
        setInfoMessage("");
        setEmail("");
        setActiveTab(tab);
    }; 

        const renderBuyerTab = () => {
        return (
            <div className={styles.tabContent}>
                <div className={styles.contentTop}>
                    <p className={styles.contentTitle}>Track Your Orders</p>
                    <p className={styles.contentText}>
                        Enter the email you used while shopping. We will email you a one-time link to see all your orders and chat history.
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
                    {infoMessage ? <p className={styles.hint}>{infoMessage}</p> : null}
                    <button
                        className={styles.primaryBtn}
                        onClick={handleSendLoginLink}
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Email me a login link →"}
                    </button>
                </div>

                <p className={styles.hint}>
                    No account or password needed. The link works once and expires in 20 minutes.
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
                    <p className={styles.perk}>✓ Buyers’ payments are held safely, then sent to your bank after delivery</p>
                    <p className={styles.perk}>✓ No tech skills. No developer. No stress.</p>
                </div>

                <button
                    className={styles.primaryBtn}
                    onClick={() => navigate("/register")}
                >
                    Signup to generate Your Store →
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
                <img src={logo} alt="MoonStore logo" className={styles.logoImg} />
                <h1 className={styles.logo}>MoonStore</h1>
                <p className={styles.tagline}>Build From Home. Sell Beyond Home.</p>
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

            <StepsSection />
            <FAQSection />

        
            <div className={styles.footer}>
            <div className={styles.legal}>
                            <Link
                                className={styles.legalLink}
                                to="/aboutus"
                            >
                                About Us
                            </Link>
                            <span className={styles.dot}>·</span>
            
                            <Link
                                className={styles.legalLink}
                                to="/privacypolicy"
                            >
                                Privacy Policy
                            </Link>
                            <span className={styles.dot}>·</span>
                            <Link
                                className={styles.legalLink}
                                to="/termsofservice"
                            >
                                Terms of Service
                            </Link>

                            <Link
                                className={styles.legalLink}
                                to="/acceptableusepolicy"
                            >
                                Acceptable Use Policy
                            </Link>
                        </div>
            
                        {/* powered by */}
                        <p className={styles.poweredBy}>
                            Powered by <span className={styles.moonstore}>MoonStore</span>
                        </p>
                        </div>
        </div>

        
    );
};

export default HomePage;