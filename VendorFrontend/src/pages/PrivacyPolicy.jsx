import styles from "./PrivacyPolicy.module.css";
import { useNavigate } from "react-router-dom";

function PrivacyPolicy(){
    const navigate = useNavigate();
    return(
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
                ←
            </button>
            <div className={styles.content}>
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.updated}>Last updated: May 2026</p>

                <p className={styles.intro}>
                    MoonStore is committed to protecting your privacy. This
                    policy explains how we collect, use, and protect your
                    information when you use our platform, whether you are
                    a seller managing your store or a buyer browsing products.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Who We Are</h2>
                    <p className={styles.sectionText}>
                        MoonStore is an online storefront platform that helps
                        African vendors showcase their
                        products and receive orders directly in their store chat inbox.
                        MoonStore is not a marketplace. Each seller has their
                        own independent store.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
                    <p className={styles.sectionText}>
                        For sellers we collect your business name, email
                        address, WhatsApp number, physical address, and
                        store information you provide during setup. We also
                        store your product listings and category information.
                    </p>
                    <p className={styles.sectionText}>
                        For buyers, we do not require you to create an account.
When you click the "Order Now" button, your order
details are sent directly to the seller inside MoonStore's
built-in chat.
                    </p>
                    <p className={styles.sectionText}>
                        We collect basic analytics data such as total sales amount, pending settlement, store visits
                        product clicks and product sold to help sellers understand their
                        store performance. This data is anonymous and not
                        linked to individual buyers.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
                    <p className={styles.sectionText}>
                        We use seller information to create and manage your
                        storefront, display your products to buyers, and
                        communicate with you about your account and
                        subscription. We do not sell your information to
                        any third party.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. Images and Files</h2>
                    <p className={styles.sectionText}>
                        Product images and store logos uploaded by sellers
                        are stored securely on Cloudinary. These images are
                        publicly visible on your storefront so that buyers
                        can see your products.
                    </p>
                </div>

                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Data Security</h2>
                    <p className={styles.sectionText}>
                        Seller passwords are encrypted and never stored in
                        plain text. All data is transmitted over secure HTTPS
                        connections. We take reasonable measures to protect
                        your information from unauthorised access.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Third Party Services</h2>
                    <p className={styles.sectionText}>
                        MoonStore uses Cloudinary for image storage and
                        MongoDB for database management. These services have
                        their own privacy policies. Orders are processed within MoonStore's own secure chat
                        system. MoonStore does not store your card or banking details directly — payments are handled through our
                        licensed payment partner, Paystack, and settled automatically to the seller's bank account.</p>
                </div>


                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>7. Your Rights</h2>
                    <p className={styles.sectionText}>
                        As a seller you can update your store information at
                        any time through your dashboard settings. You can
                        also delete your account permanently from the settings
                        page. Deleting your account removes all your store
                        data, products, and categories from our system.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>8. Contact Us</h2>
                    <p className={styles.sectionText}>
                        If you have any questions about this privacy policy
                        or how we handle your data, contact us directly on
                        WhatsApp at +2348152905325. We respond to every
                        message personally.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;