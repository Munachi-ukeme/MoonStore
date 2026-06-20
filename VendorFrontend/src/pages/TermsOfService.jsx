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
                <p className={styles.updated}>Last updated: May 2026</p>

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
                        Your store is activated after your subscription
                        payment is confirmed. MoonStore reserves the right
                        to deactivate any store that violates these terms
                        without refund.
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
                    <h2 className={styles.sectionTitle}>4. Subscription and Payment</h2>
                    <p className={styles.sectionText}>
                        MoonStore operates on a monthly subscription model.
                        Plans start at ₦15,000 per month for the Basic plan.
                        Subscription fees are non-refundable once your store
                        has been activated and set up.
                    </p>
                    <p className={styles.sectionText}>
                        A platform service fee of 1.5% applies to every order
                        processed through your store. This fee covers payment
                        processing, automatic settlement and the security of
                        every transaction. Payments are processed through our
                        licensed payment partner, Paystack, and settled
                        directly to your bank account daily.
                    </p>
                    <p className={styles.sectionText}>
                        Your store will be deactivated if your subscription
                        expires and is not renewed. Your data is not deleted
                        immediately, you have a grace period to renew before
                        permanent deletion.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Referral Programme</h2>
                    <p className={styles.sectionText}>
                        MoonStore offers a referral programme where existing
                        sellers earn a commission for every new seller they
                        refer who successfully pays their first subscription.
                        Commission amounts are displayed in your seller
                        dashboard and may be updated by MoonStore from time
                        to time. Commission is paid via bank transfer after
                        the referred seller's first payment is confirmed.
                        Commission is not paid for referrals that do not
                        complete payment.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Plan Limits</h2>
                    <p className={styles.sectionText}>
                        Each plan has product limits. Basic sellers can list
                        up to 25 products. Pro sellers can list up to 60
                        products. Premium sellers have no product limit.
                        Exceeding your plan limit requires an upgrade.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>7. Account Deletion</h2>
                    <p className={styles.sectionText}>
                        You can delete your account at any time from your
                        dashboard settings. Deleting your account permanently
                        removes your store, all products, all categories, and
                        all store data. This action cannot be undone. No
                        refund is issued for unused subscription days.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>8. MoonStore's Rights</h2>
                    <p className={styles.sectionText}>
                        MoonStore reserves the right to modify these terms
                        at any time. Sellers will be notified of significant
                        changes via email. Continued use of the platform
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
                    <h2 className={styles.sectionTitle}>9. Limitation of Liability</h2>
                    <p className={styles.sectionText}>
                        MoonStore is a platform provider. We are not
                        responsible for the quality of products sold by
                        sellers, disputes between sellers and buyers, or
                        delivery failures. While all communication and
                        payment happen securely within MoonStore, fulfillment
                        of the order itself remains the seller's
                        responsibility.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>10. Contact</h2>
                    <p className={styles.sectionText}>
                        For any questions about these terms contact us
                        directly on WhatsApp at +2348152905325. We respond
                        to every message personally.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TermsOfServicePage;