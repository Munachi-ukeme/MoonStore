import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestBuyerLoginLink } from "../api/api";
import styles from "./HomePage.module.css";
import StepsSection from "../sellerComponent/StepsSection";
import FAQSection from "../sellerComponent/FAQSection";
import logo from "../assets/logo.png";

// Add these three image files to src/assets, or change the imports to match
// the filenames you use for your generated images.
import heroVendor from "../assets/hero.png"
import vendorProblem from "../assets/vendorproblem.png";
import buyerParcel from "../assets/buyerparcel.png";

const HomePage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

    const handleSendLoginLink = async (event) => {
        event.preventDefault();
        setError("");
        setInfoMessage("");

        if (!email.trim()) {
            setError("Please enter the email address you used when placing your order.");
            return;
        }

        setLoading(true);
        try {
            const result = await requestBuyerLoginLink(email.trim());
            if (result?.error) {
                setError(result.error);
            } else {
                setInfoMessage(result?.message || "If an order is linked to this email, a login link will be sent.");
            }
        } catch {
            setError("We couldn't send your login link. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <Link to="/" className={styles.brand} aria-label="MoonStore home">
                    <img src={logo} alt="MoonStore" className={styles.logo} />
                    <span className={styles.brandText}>
                        <strong>MoonStore</strong>
                        <small>Buy with greater confidence. Sell with less stress.</small>
                    </span>
                </Link>

                <nav className={styles.nav} aria-label="Main navigation">
                    <a href="#how-it-works">How It Works</a>
                    <a href="#for-vendors">For Vendors</a>
                    <a href="#faqs">FAQs</a>
                </nav>

                <div className={styles.headerActions}>
                    <button className={styles.loginButton} onClick={() => navigate("/login")}>
                        Log in
                    </button>
                    <button className={styles.headerCta} onClick={() => navigate("/register")}>
                        Start Selling <span aria-hidden="true">→</span>
                    </button>
                </div>
            </header>

            <section className={styles.hero} id="for-vendors">
                <div className={styles.heroCopy}>
                    <span className={styles.eyebrow}>FOR AFRICAN FASHION VENDORS</span>
                    <h1>
                        Run your fashion business with <span>less stress.</span>
                    </h1>
                    <p>
                        Give customers an easier way to browse your products, place orders
                        and pay with greater confidence.
                    </p>
                    <div className={styles.heroActions}>
                        <button className={styles.primaryButton} onClick={() => navigate("/register")}>
                            Start Selling <span aria-hidden="true">→</span>
                        </button>
                        <a className={styles.secondaryButton} href="#how-it-works">
                            See How It Works
                        </a>
                    </div>
                    <p className={styles.heroNote}>No coding. No developer. No monthly subscription.</p>
                </div>
                <div className={styles.heroVisual}>
                    <img src={heroVendor} alt="Fashion vendor managing her business with a smartphone" />
                    <div className={styles.imageNote}>
                        <span className={styles.noteIcon}>✓</span>
                        Your business. Your online store.
                    </div>
                </div>
            </section>

            <section className={styles.problemSection}>
                <div className={styles.problemImage}>
                    <img src={vendorProblem} alt="Fashion vendor handling several customer enquiries on her phone" />
                </div>
                <div className={styles.problemCopy}>
                    <span className={styles.eyebrow}>THE EVERYDAY CHALLENGE</span>
                    <h2>Getting enquiries is easy. Turning them into paid orders is harder.</h2>
                    <p>Running a fashion business online can mean spending too much time answering the same questions.</p>
                    <ul className={styles.checkList}>
                        <li>Customers ask about prices, sizes and colours repeatedly.</li>
                        <li>Some people show interest but never place an order.</li>
                        <li>Buyers may hesitate because they fear paying and not receiving their items.</li>
                        <li>Keeping track of orders across different messages can become stressful.</li>
                    </ul>
                </div>
            </section>

            <section className={styles.solutionSection}>
                <div className={styles.sectionIntro}>
                    <span className={styles.eyebrow}>A BETTER WAY TO SELL</span>
                    <h2>Give your fashion business a better way to sell.</h2>
                    <p>
                        MoonStore gives you your own branded online store and tools to manage
                        orders, while helping buyers shop with greater confidence.
                    </p>
                </div>

                <div className={styles.benefitGrid}>
                    <article className={styles.benefitCard}>
                        <div className={styles.benefitIcon}>▣</div>
                        <h3>Your own branded store</h3>
                        <p>Show your products, prices and business details in one place you can share with customers.</p>
                    </article>
                    <article className={styles.benefitCard}>
                        <div className={styles.benefitIcon}>✓</div>
                        <h3>Escrow-protected payments</h3>
                        <p>Buyer payments are held through the escrow process and released according to the order rules.</p>
                    </article>
                    <article className={styles.benefitCard}>
                        <div className={styles.benefitIcon}>▤</div>
                        <h3>Keep orders together</h3>
                        <p>Customers can browse, order and chat with you through your MoonStore store.</p>
                    </article>
                </div>
            </section>

            <StepsSection />

            <section className={styles.escrowSection}>
                <div className={styles.escrowImage}>
                    <img src={buyerParcel} alt="Customer receiving and checking a delivered fashion parcel" />
                </div>
                <div className={styles.escrowCopy}>
                    <span className={styles.eyebrow}>PAYMENT PROTECTION</span>
                    <h2>Help customers feel safer paying for your products.</h2>
                    <p>
                        Buyers pay through MoonStore. The payment is held by Rubies Microfinance
                        Bank through the EscrowPay process while the order is being fulfilled.
                    </p>
                    <ol className={styles.escrowSteps}>
                        <li><strong>Buyer pays</strong><span>Payment enters the escrow process.</span></li>
                        <li><strong>You ship the order</strong><span>You arrange delivery with your preferred delivery person.</span></li>
                        <li><strong>Buyer confirms the parcel</strong><span>The buyer checks the parcel code and confirms receipt in the order chat.</span></li>
                    </ol>
                    <p className={styles.escrowFootnote}>
                        Funds are released according to the escrow rules, including the applicable dispute period.
                    </p>
                </div>
            </section>

            <section className={styles.marketplaceBanner}>
                <div>
                    <span className={styles.comingSoon}>COMING SOON</span>
                    <h2>More ways for customers to discover your products.</h2>
                    <p>
                        We're working on a fashion marketplace where shoppers can discover
                        products from different MoonStore vendors.
                    </p>
                </div>
                <div className={styles.marketplaceVisual} aria-hidden="true">
                    <span>Coming<br />Soon</span>
                </div>
            </section>

            <section className={styles.orderLookup}>
                <div>
                    <span className={styles.eyebrow}>ALREADY SHOPPED ON MOONSTORE?</span>
                    <h2>Track your order and continue your chat.</h2>
                    <p>Enter the email address you used when shopping. We'll send you a one-time link to access your orders and chat history.</p>
                </div>
                <form className={styles.lookupForm} onSubmit={handleSendLoginLink}>
                    <label htmlFor="buyer-email">Email address</label>
                    <input
                        id="buyer-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    {error && <p className={styles.formError}>{error}</p>}
                    {infoMessage && <p className={styles.formInfo}>{infoMessage}</p>}
                    <button className={styles.primaryButton} type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Email me a login link →"}
                    </button>
                    <small>No password needed. The link expires after 20 minutes.</small>
                </form>
            </section>

            <FAQSection />

            <section className={styles.finalCta}>
                <div>
                    <span className={styles.eyebrow}>YOUR BUSINESS CAN SELL WITH LESS STRESS</span>
                    <h2>Give your fashion business a better way to sell.</h2>
                    <p>Create your store and give customers a clearer way to shop from you.</p>
                </div>
                <button className={styles.finalCtaButton} onClick={() => navigate("/register")}>
                    Start Selling on MoonStore <span aria-hidden="true">→</span>
                </button>
            </section>

            <footer className={styles.footer}>
                <Link to="/" className={styles.footerBrand}>
                    <img src={logo} alt="" />
                    <span><strong>MoonStore</strong><small>Buy with greater confidence. Sell with less stress.</small></span>
                </Link>
                <nav className={styles.footerLinks} aria-label="Footer navigation">
                    <Link to="/aboutus">About Us</Link>
                    <Link to="/privacypolicy">Privacy Policy</Link>
                    <Link to="/termsofservice">Terms of Service</Link>
                    <Link to="/acceptableusepolicy">Acceptable Use Policy</Link>
                    <Link to="/refundrules">Refund Rules</Link>

                </nav>
                <p>Powered by <strong>MoonStore</strong></p>
            </footer>
        </main>
    );
};

export default HomePage;
