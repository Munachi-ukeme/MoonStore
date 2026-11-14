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
                <p className={styles.updated}>Last updated: October 2026</p>

                <p className={styles.intro}>
                    By using MoonStore you agree to these terms. Please read
                    them carefully. If you do not agree, do not use the
                    platform.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. What MoonStore Is</h2>
                    <p className={styles.sectionText}>
                        MoonStore gives African fashion vendors their own
                        branded store page where buyers can browse products,
                        chat with the seller, and place orders directly
                        inside the store. Sellers sell independently, and
                        their products can also be discovered through the
                        MoonStore marketplace. All orders happen exclusively
                        through MoonStore's built-in chat, there is no cart
                        and no checkout outside of it. Legal entity: MoonStore
                        Branded Stores Technologies (CAC-registered), trading
                        as "MoonStore".
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Seller Accounts</h2>
                    <p className={styles.sectionText}>
                        To use MoonStore as a seller you must provide
                        accurate business information during registration.
                        You must complete escrow onboarding (identity
                        verification and payout account setup) before your
                        Products and Categories dashboard unlocks. You are
                        responsible for maintaining the security of your
                        login credentials and must not share your account
                        with anyone else.
                    </p>
                    <p className={styles.sectionText}>
                        MoonStore reserves the right to deactivate any store
                        that violates these terms. Sellers inactive for 90
                        days receive a warning, and may be permanently
                        deleted after a further 7-day grace period.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. Seller Responsibilities</h2>
                    <p className={styles.sectionText}>
                        You are solely responsible for the products you list
                        on your store. You must not list counterfeit
                        products, stolen goods, illegal items, or anything
                        that violates Nigerian law.
                    </p>
                    <p className={styles.sectionText}>
                        You must mark an order "Shipped" within 48 hours of
                        payment, or the buyer is automatically refunded.
                        What happens after that, packaging, dispatch, and
                        delivery, is your responsibility as the seller,
                        including ensuring your stated delivery price
                        reasonably covers actual delivery cost.
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
                        MoonStore does not charge setup fees, monthly
                        subscriptions, or upfront costs to operate a store.
                    </p>
                    <p className={styles.sectionText}>
                        A platform commission of 4% of the order's product
                        price is deducted from the seller's payout when
                        funds are released, with a minimum fee of ₦250 and a
                        maximum of ₦4,000 per transaction. This is not
                        charged to the buyer. Buyers separately pay the
                        delivery fee and our escrow partner's own processing
                        fee at checkout.
                    </p>
                    <p className={styles.sectionText}>
                        All payments are processed through EscrowPay and
                        held in escrow, funds are not released to the
                        seller immediately on payment. Funds are released
                        automatically once the delivery window plus a
                        48-hour buffer has passed, or earlier if the buyer
                        confirms delivery via PIN (plus a 48-hour dispute
                        window), or as decided by MoonStore in the event of
                        a dispute.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Buyer Identity Verification</h2>
                    <p className={styles.sectionText}>
                        Before completing a first payment, buyers must
                        complete a one-time identity verification using
                        their NIN. This is a requirement of the banking
                        partner that holds funds in escrow, not a MoonStore
                        policy choice. Verification is required once across
                        the platform, returning buyers are not asked again.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Store Limits</h2>
                    <p className={styles.sectionText}>
                        Every registered seller on MoonStore receives
                        identical platform access and resource ceilings: up
                        to 200 listed products, up to 30 categories, and up
                        to 5 high-resolution images per product.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>7. Refunds & Disputes</h2>
                    <p className={styles.sectionText}>
                        If a buyer never confirms delivery, their payment
                        remains held in escrow for the full delivery window
                        plus a 48-hour buffer before being released to the
                        seller, buyer funds are protected for that entire
                        period regardless of confirmation.
                    </p>

                    <p className={styles.sectionText}>
                        If a buyer is unhappy with a purchase, they may
                        raise a dispute directly within the order chat. This
                        pauses fund release and brings MoonStore support
                        into the conversation. MoonStore reviews disputes
                        and may decide a full release to the seller, a full
                        refund to the buyer, or a split between both
                        parties. Once the full delivery window
                        plus a 48-hour buffer is over and the buyer didn't raise a dispute, the money is released to the seller. Buyer cannot raise a dispute again.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore's 4% platform commission is non-refundable
                        once a transaction is complete.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>8. Account Deletion</h2>
                    <p className={styles.sectionText}>
                        You can delete your account at any time from your
                        dashboard settings. Deleting your account
                        permanently removes your store, all products, all
                        categories, and all stored data. This action cannot
                        be undone. We retain a record of the stated reason
                        for deletion even after the account is removed.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>9. MoonStore's Rights</h2>
                    <p className={styles.sectionText}>
                        MoonStore reserves the right to modify these terms
                        at any time. Sellers will be notified of significant
                        changes via email or dashboard notifications.
                        Continued use of the platform after changes means
                        you accept the updated terms.
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
                        MoonStore provides the platform infrastructure,
                        including escrow-protected payments and in-built
                        chat. We are not responsible for the quality of
                        products sold by sellers or for delivery failures.
                        Order fulfillment remains the seller's
                        responsibility.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>11. Contact</h2>
                    <p className={styles.sectionText}>
                        For any questions about these terms contact us
                        directly on WhatsApp at +2349126664419. We respond
                        to every message personally.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TermsOfServicePage;