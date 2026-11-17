
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
                <p className={styles.updated}>Last updated: November 2026</p>

                <p className={styles.intro}>
                    By using MoonStore you agree to these terms. Please read
                    them carefully. If you do not agree, do not use the
                    platform.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. What MoonStore Is</h2>
                    <p className={styles.sectionText}>
                        MoonStore is a fashion e-commerce platform that helps
                        fashion vendors sell smarter, reduce the stress of
                        managing sales, and grow their businesses online, while
                        giving buyers a safer and easier way to shop for fashion.
                        Vendors receive their own branded store pages where
                        buyers can browse products, chat with sellers, and place
                        orders. Sellers operate independently, and their
                        products can also be discovered through the MoonStore
                        marketplace. All orders happen through MoonStore's
                        built-in chat. There is no cart or checkout outside the
                        platform. The legal business name is MoonStore Branded
                        Stores Technologies, registered with the Corporate
                        Affairs Commission (CAC), and operating as "MoonStore".
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Seller Accounts</h2>
                    <p className={styles.sectionText}>
                        To use MoonStore as a seller, you must provide accurate
                        business information during registration. You must
                        complete escrow onboarding, including identity
                        verification and payout account setup, before your
                        Products and Categories dashboard unlocks. You are
                        responsible for keeping your login details secure and
                        must not share your account with anyone else.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore reserves the right to deactivate any store
                        that violates these terms. Sellers who remain inactive
                        for 90 days will receive a warning. If they remain
                        inactive after a further 7-day grace period, their
                        accounts may be permanently deleted.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. Seller Responsibilities</h2>
                    <p className={styles.sectionText}>
                        You are responsible for the products you list on your
                        store. You must not list counterfeit products, stolen
                        goods, illegal items, or anything that violates Nigerian
                        law.
                    </p>

                    <p className={styles.sectionText}>
                        You must mark an order as "Shipped" within 48 hours of
                        payment. If you fail to do this, the buyer will
                        automatically receive a refund. Packaging, dispatch,
                        and delivery are your responsibility as the seller.
                        You must also ensure that your stated delivery price
                        reasonably covers the actual delivery cost.
                    </p>

                    <p className={styles.sectionText}>
                        Product images and descriptions must be accurate.
                        Misleading buyers with fake images or false
                        descriptions violates these terms and may result in
                        account deactivation.
                    </p>

                    <p className={styles.sectionText}>
                        When you mark an order as shipped, MoonStore generates
                        a parcel code and sends it to both you and the buyer
                        through the order chat. You must write this code on
                        the package. The buyer will compare the code on the
                        package with the code received in the order chat and
                        enter it in the chat to confirm receipt of the correct
                        parcel.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. Platform Fees and Payments</h2>
                    <p className={styles.sectionText}>
                        MoonStore does not charge setup fees, monthly
                        subscriptions, or upfront costs to operate a store.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore charges a platform commission of 4% of the
                        order's product price. This amount is deducted from
                        the seller's payout when funds are released. The
                        minimum commission is ₦500 and the maximum is ₦5,000
                        per transaction. This commission is not charged to
                        the buyer. Buyers separately pay the delivery fee and
                        EscrowPay's processing fee at checkout.
                    </p>

                    <p className={styles.sectionText}>
                        Payments are processed through EscrowPay in
                        partnership with Rubies Microfinance Bank Limited,
                        which holds the funds in escrow. Rubies Microfinance
                        Bank Limited is licensed by the Central Bank of
                        Nigeria. MoonStore does not hold the escrow funds
                        itself. Funds are not released to the seller
                        immediately after payment.
                    </p>

                    <p className={styles.sectionText}>
                        When a buyer enters the parcel code in the order chat
                        to confirm receipt of the correct parcel, a 48-hour
                        dispute window begins. If no dispute is raised during
                        that period, the funds can be released to the seller.
                        If the buyer does not confirm delivery, the funds
                        remain held until the full delivery window plus a
                        48-hour buffer has passed. If no dispute is raised
                        before that period ends, the transaction is treated
                        as complete and the funds are released to the seller.
                        If a dispute is raised, the release of funds is paused
                        while the dispute is reviewed.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Buyer Identity Verification</h2>
                    <p className={styles.sectionText}>
                        Before completing their first payment, buyers must
                        complete a one-time identity verification using their
                        National Identification Number (NIN). This requirement
                        comes from the financial service providers involved
                        in the escrow process. Verification is required once
                        across the platform, so returning buyers are not
                        asked to complete it again.
                    </p>

                    <p className={styles.sectionText}>
                        Identity information submitted for verification is
                        processed through the relevant verification and
                        escrow service providers. MoonStore does not store
                        buyers' NIN or date of birth. MoonStore stores only
                        the verification reference number and verification
                        result or status provided by the service.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Store Limits</h2>
                    <p className={styles.sectionText}>
                        Every registered seller on MoonStore receives the
                        same platform access and resource limits: up to 200
                        listed products, up to 30 categories, and up to 5
                        high-resolution images per product.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>7. Refunds & Disputes</h2>
                    <p className={styles.sectionText}>
                        If a buyer does not confirm delivery using the parcel
                        code, the payment remains held in escrow until the
                        full delivery window plus a 48-hour buffer has passed.
                        If no dispute is raised before that period ends, the
                        funds are released to the seller and the transaction
                        is treated as complete.
                    </p>

                    <p className={styles.sectionText}>
                        If a buyer has a problem with an order, they may raise
                        a dispute directly in the order chat. Raising a
                        dispute pauses the release of funds and brings
                        MoonStore support into the conversation to review
                        the issue.
                    </p>

                    <p className={styles.sectionText}>
                        After reviewing a dispute, MoonStore may decide to
                        release the full payment to the seller, issue a full
                        refund to the buyer, or split the payment between
                        both parties. The decision will depend on the details
                        of the dispute.
                    </p>

                    <p className={styles.sectionText}>
                        Once the full delivery window plus the 48-hour buffer
                        has passed without a dispute being raised, the
                        transaction is considered complete. The funds are
                        released to the seller, and the buyer can no longer
                        raise a dispute for that transaction.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore's 4% platform commission is non-refundable
                        once a transaction is complete.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>8. Account Deletion</h2>
                    <p className={styles.sectionText}>
                        You can request to delete your seller account from
                        your dashboard settings. However, you cannot delete
                        your account while an order still has funds held in
                        escrow.
                    </p>

                    <p className={styles.sectionText}>
                        When your account is deleted, your store, products,
                        categories, and conversations are deleted. We retain
                        a limited deletion record containing your business
                        name, email address, WhatsApp number, reason for
                        deletion, and date of deletion. Other account data
                        is deleted.
                    </p>

                    <p className={styles.sectionText}>
                        Account deletion is permanent and cannot be undone.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>9. MoonStore's Rights</h2>
                    <p className={styles.sectionText}>
                        MoonStore reserves the right to modify these terms
                        at any time. Sellers will be notified of significant
                        changes through email or dashboard notifications.
                        Continuing to use the platform after changes are
                        made means you accept the updated terms.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore may deactivate or delete any account that
                        violates these terms, engages in fraudulent activity,
                        or causes harm to buyers or other sellers on the
                        platform.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>10. Limitation of Liability</h2>
                    <p className={styles.sectionText}>
                        MoonStore provides the platform infrastructure,
                        including order chat and access to escrow-protected
                        payments through its payment partners. MoonStore is
                        not responsible for the quality of products sold by
                        sellers or for delivery failures. Sellers are
                        responsible for packaging, dispatch, and fulfilling
                        their orders.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>11. Contact</h2>
                    <p className={styles.sectionText}>
                        For questions about these terms, contact us directly
                        on WhatsApp at +2349126664419.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TermsOfServicePage;
