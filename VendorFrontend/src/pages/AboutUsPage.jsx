import styles from "./AboutUsPage.module.css";
import { useNavigate } from "react-router-dom";

function AboutUsPage() {
    const navigate = useNavigate();
    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
                ← Back
            </button>
            <div className={styles.content}>
                <h1 className={styles.title}>About MoonStore</h1>

                <p className={styles.intro}>
                    MoonStore was built for one reason, to give every
                    Instagram and WhatsApp vendor in Africa their own
                    branded online store. Not a marketplace. Not a shared
                    app. Just your store, with your name on it.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Why We Exist</h2>
                    <p className={styles.sectionText}>
                        Every day, thousands of vendors sell through
                        screenshots, DMs and disappearing status updates.
                        Buyers get lost in the back and forth. Sales slip
                        away in silence. We built MoonStore to close that
                        gap — a store that's always open, where buyers can
                        browse, chat and pay, all in one place.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>What Makes Us Different</h2>
                    <p className={styles.sectionText}>
                        MoonStore is not a marketplace where you compete
                        with hundreds of other sellers. It's your own
                        branded storefront. Buyers chat with you directly
                        inside your store and pay securely — no Paystack
                        setup needed on your end, no external links, no
                        confusion.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Built With You In Mind</h2>
                    <p className={styles.sectionText}>
                        We built MoonStore for vendors with zero tech
                        background. No code, no confusing dashboards, no
                        developer needed. You focus on selling — we handle
                        everything running quietly underneath.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Promise</h2>
                    <p className={styles.sectionText}>
                        Your store. Your rules. We're committed to building
                        a platform that grows with you — from your first
                        sale to your thousandth.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AboutUsPage;