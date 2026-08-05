// pages/TermsOfServicePage.jsx
import styles from "./TermsOfService.module.css";
import { useNavigate } from "react-router-dom";

function TermsOfServicePage() {
    const navigate = useNavigate();
    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
                ←
            </button>
            <div className={styles.content}>
                <h1 className={styles.title}>Terms of Service</h1>
                <p className={styles.updated}>Last updated: August 2026</p>

                <p className={styles.intro}>
                    By using MoonStore you agree to these terms. Please read
                    them carefully. If you do not agree, do not use the
                    platform.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. What MoonStore Is</h2>
                    <p className={styles.sectionText}>
                        MoonStore is an online storefront platform that gives
                        African vendors their own branded store page where
                        buyers can browse products, chat with the seller and
                        place orders directly inside the store. MoonStore is
                        not a marketplace. We do not sell products ourselves.
                        We provide the tools for sellers to sell.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Seller Accounts</h2>
                    <p className={styles.sectionText}>
                        To use MoonStore as a seller you must provide accurate
                        business information during registration. You are
                        responsible for maintaining the security of your login
                        credentials. You must not share your account with
                        anyone else.
                    </p>
                    <p className={styles.sectionText}>
                        Your store is activated immediately upon completed registration. 
                        MoonStore reserves the right to deactivate any store that 
                        violates these terms.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. Seller Responsibilities</h2>
                    <p className={styles.sectionText}>
                        You are solely responsible for the products you list
                        on your store. You must not list counterfeit products,
                        stolen goods, illegal items, or anything that violates
                        Nigerian law. MoonStore is not responsible for
                        disputes between sellers and buyers.
                    </p>
                    <p className={styles.sectionText}>
                        You are responsible for fulfilling orders placed
                        through your store. All buyer communication and order
                        confirmation happens inside MoonStore's built-in chat.
                        What happens after an order is placed — packaging,
                        dispatch and delivery — is your responsibility as the
                        seller.
                    </p>
                    <p className={styles.sectionText}>
                        Product images and descriptions must be accurate.
                        Misleading buyers with fake images or false
                        descriptions is a violation of these terms and may
                        result in account deactivation.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. Platform Fees and Payments</h2>
                    <p className={styles.sectionText}>
                        MoonStore does not charge setup fees, monthly subscriptions,
                        or upfront costs to operate a store.
                    </p>
                    <p className={styles.sectionText}>
                        A platform service fee of 4% is deducted directly from the
                        seller's share of every completed sale processed through your store. 
                        Payment processing fees charged by our payment gateway partner, 
                        Paystack, are added directly to the total price paid by the buyer 
                        at checkout.
                    </p>
                    <p className={styles.sectionText}>
                        All customer payments are processed through Paystack and settled
                        directly to your registered bank account according to Paystack's
                        standard payout schedules.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Store Limits</h2>
                    <p className={styles.sectionText}>
                        Every registered seller on MoonStore receives identical platform access
                        and resource ceilings: up to 200 listed products, up to 30 categories,
                        and up to 5 high-resolution images per product.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Refunds & Disputes</h2>
                    <p className={styles.sectionText}>
                        MoonStore is a platform provider connecting buyers with independent 
                        sellers. We are not a direct party to transactions between buyers and 
                        sellers and do not issue direct refunds or handle returns.
                    </p>
                    <p className={styles.sectionText}>
                        If a buyer is unhappy with a purchase, their primary resolution path 
                        is contacting the seller directly through built-in chat. If a seller 
                        is unresponsive or fraudulent, buyers may use the Report feature inside 
                        chat. MoonStore will review the interaction and may suspend fraudulent seller stores.
                    </p>
                    <p className={styles.sectionText}>
                        Refunds remain at the sole discretion of the seller. MoonStore does 
                        not hold or control seller funds and cannot forcibly issue refunds on 
                        a seller's behalf. MoonStore's 4% platform fee deducted at the time of 
                        payment processing is non-refundable.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>7. Referral Programme</h2>
                    <p className={styles.sectionText}>
                        MoonStore may offer a referral programme where existing
                        sellers earn rewards or commissions for referring new active
                        sellers to the platform. Commission terms, eligibility criteria, 
                        and payment schedules are displayed within your seller dashboard and 
                        may be updated by MoonStore periodically.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>8. Account Deletion</h2>
                    <p className={styles.sectionText}>
                        You can delete your account at any time from your
                        dashboard settings. Deleting your account permanently
                        removes your store, all products, all categories, and
                        all stored data. This action cannot be undone.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>9. MoonStore's Rights</h2>
                    <p className={styles.sectionText}>
                        MoonStore reserves the right to modify these terms
                        at any time. Sellers will be notified of significant
                        changes via email or dashboard notifications. Continued use of the platform
                        after changes means you accept the updated terms.
                    </p>
                    <p className={styles.sectionText}>
                        MoonStore reserves the right to deactivate or delete
                        any account that violates these terms, engages in
                        fraudulent activity, or causes harm to buyers or
                        other sellers on the platform.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>10. Limitation of Liability</h2>
                    <p className={styles.sectionText}>
                        MoonStore provides the platform infrastructure. We are not
                        responsible for the quality of products sold by
                        sellers, disputes between sellers and buyers, or
                        delivery failures. While communication and payment processing
                        happen securely through integrated providers, order fulfillment
                        remains strictly the seller's responsibility.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>11. Contact</h2>
                    <p className={styles.sectionText}>
                        For any questions about these terms contact us
                        directly on WhatsApp at +2349132227203. We respond
                        to every message personally.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TermsOfServicePage;