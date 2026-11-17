
import styles from "./PrivacyPolicy.module.css";
import { useNavigate } from "react-router-dom";

function PrivacyPolicy() {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={handleBack}>
                ←
            </button>

            <div className={styles.content}>
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.updated}>Last updated: November 2026</p>

                <p className={styles.intro}>
                    MoonStore is committed to protecting your privacy.
                    This policy explains how we collect, use, share, and
                    protect your information when you use our platform,
                    whether you are a Seller managing your own store, a
                    Buyer browsing the marketplace, or placing an order
                    through a Seller's store.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Who We Are</h2>
                    <p className={styles.sectionText}>
                        MoonStore Branded Stores Technologies is the
                        registered business responsible for operating
                        MoonStore. MoonStore is our operating name.
                    </p>
                    <p className={styles.sectionText}>
                        MoonStore is a fashion e-commerce platform that
                        helps independent fashion vendors sell through
                        their own online stores, with products also
                        discoverable through the MoonStore marketplace.
                        Buyers can browse products, place orders, make
                        payments, and communicate with Sellers through
                        the platform's order chat.
                    </p>
                    <p className={styles.sectionText}>
                        Payments made through our official payment process
                        are handled through EscrowPay and its banking
                        partner, Rubies Microfinance Bank Limited. Funds
                        are held by the bank and released according to
                        the applicable escrow process.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        2. Information We Collect
                    </h2>

                    <p className={styles.sectionText}>
                        <strong>Seller information.</strong> When a Seller
                        registers and uses MoonStore, we collect
                        information such as their business name, email
                        address, password, WhatsApp number, phone number,
                        business address, bank account details for
                        receiving payouts, and the delivery options
                        configured for their store.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Buyer information.</strong> When a Buyer
                        places an order, we collect their email address,
                        name, delivery address, city, phone number, and
                        delivery zone selection. Buyers do not need to
                        create a full MoonStore account before ordering.
                        Their orders are associated with their email
                        address and session information.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Identity verification.</strong> Our
                        payment partner, EscrowPay, requires identity
                        verification to support the payment process.
                        Sellers provide their identity information so
                        that a payout account can be created for them.
                        Buyers provide their identity information so
                        that they can receive money into their bank
                        accounts if a refund is necessary.
                    </p>

                    <p className={styles.sectionText}>
                        For this verification, we send your National
                        Identification Number (NIN) and date of birth
                        to EscrowPay. We do not request your BVN for
                        this process. MoonStore does not store or log
                        your NIN or date of birth. We retain only the
                        verification reference number provided by
                        EscrowPay and the verification result.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Order information.</strong> When you
                        place an order, we keep a record of the product
                        details at the time of purchase, including the
                        product name, price, image, colour, size, and
                        quantity. This helps us identify what was
                        ordered if a question or dispute arises.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Delivery information.</strong> When a
                        Seller marks an order as shipped, MoonStore
                        generates a parcel code and sends it to both
                        the Buyer and Seller through their order chat.
                        The Seller writes the code on the package.
                        The Buyer can compare the code on the package
                        with the one received in the chat and enter
                        it in the order chat to confirm receipt of
                        the correct parcel.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Chats and platform activity.</strong>
                        We collect messages and images sent through
                        order chats. Images sent in chat are compressed.
                        We also collect session information and basic
                        analytics, such as store visits, product clicks,
                        and sales performance, to help operate MoonStore
                        and help Sellers understand how their stores
                        are performing.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        3. How We Use Your Information
                    </h2>

                    <p className={styles.sectionText}>
                        We use Seller information to create and manage
                        their stores, display their products, process
                        orders, arrange payouts, and communicate about
                        their accounts.
                    </p>

                    <p className={styles.sectionText}>
                        We use Buyer information to process orders,
                        communicate order updates, provide delivery
                        information, send delivery PINs and other
                        notifications, and handle reported issues
                        or disputes.
                    </p>

                    <p className={styles.sectionText}>
                        We send identity information to EscrowPay for
                        the verification and payment-related purposes
                        described in this policy. MoonStore keeps the
                        verification reference and result, not the
                        NIN or date of birth.
                    </p>

                    <p className={styles.sectionText}>
                        We also use information to maintain platform
                        security, prevent misuse, investigate reported
                        activity, and improve MoonStore. We do not sell
                        your personal information to third parties.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        4. Who Can See Your Information
                    </h2>

                    <p className={styles.sectionText}>
                        When you place an order, the Seller receives
                        the information needed to process and deliver
                        it. This includes your name, delivery address,
                        phone number, and messages in the order chat.
                        Sellers cannot currently see Buyers' email
                        addresses through MoonStore.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore support may access order conversations
                        when a conversation is reported or an order is
                        disputed, so that we can review the matter.
                    </p>

                    <p className={styles.sectionText}>
                        Buyers can see the name and phone number of the
                        delivery person entered by the Seller when
                        marking an order as shipped.
                    </p>

                    <p className={styles.sectionText}>
                        We also keep records of disputes raised by and
                        against Buyers and Sellers to help identify
                        repeated misuse of the platform.
                    </p>

                    <p className={styles.sectionText}>
                        Some information is shared with service providers
                        that help us operate MoonStore. These providers
                        receive information needed to perform their
                        services, as explained in the Third-Party
                        Services section of this policy.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        5. Images and Files
                    </h2>

                    <p className={styles.sectionText}>
                        Product images and store logos uploaded by
                        Sellers are stored using Cloudinary. These
                        images and logos are publicly visible on the
                        relevant storefronts and product listings.
                    </p>

                    <p className={styles.sectionText}>
                        Images shared in order chats are used for
                        communication and order-related purposes.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        6. Data Security
                    </h2>

                    <p className={styles.sectionText}>
                        We take steps to protect the information
                        handled through MoonStore. Seller passwords
                        are hashed and are not stored in plain text.
                        Data is transmitted over secure HTTPS
                        connections.
                    </p>

                    <p className={styles.sectionText}>
                        Your NIN and date of birth are sent to EscrowPay
                        for identity verification and are not stored
                        or logged by MoonStore. We retain only the
                        verification reference number and result.
                    </p>

                    <p className={styles.sectionText}>
                        Payment notifications received from our escrow
                        provider are cryptographically verified before
                        we rely on them.
                    </p>

                    <p className={styles.sectionText}>
                        Delivery PINs have a limited number of
                        verification attempts per hour to reduce
                        unauthorized use. Bank account numbers shared
                        in order chat are automatically blocked.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        7. Third-Party Services
                    </h2>

                    <p className={styles.sectionText}>
                        MoonStore works with third-party service
                        providers to operate the platform and provide
                        its features. These include:
                    </p>

                    <p className={styles.sectionText}>
                        <strong>EscrowPay and Rubies Microfinance Bank
                        Limited:</strong> EscrowPay facilitates the
                        escrow payment process and related identity
                        verification. Its banking partner, Rubies
                        Microfinance Bank Limited, a microfinance
                        bank licensed by the Central Bank of Nigeria
                        (CBN), holds the funds for eligible
                        transactions. Funds are released according
                        to the applicable escrow process.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Prembly:</strong> Used by EscrowPay
                        for identity verification. MoonStore sends
                        identity information to EscrowPay and does
                        not interact directly with Prembly for this
                        verification process.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Cloudinary:</strong> Used to store
                        and deliver product images and store logos.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>MongoDB Atlas:</strong> Used to host
                        and manage MoonStore's database.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Vercel and Railway:</strong> Used
                        to host parts of the MoonStore website and
                        server infrastructure.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Resend:</strong> Used to send
                        transactional emails, including relevant
                        account and order notifications.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>Termii:</strong> Used to send SMS
                        notifications, including delivery PINs and
                        relevant order or dispute updates.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        8. Data Retention and Account Deletion
                    </h2>

                    <p className={styles.sectionText}>
                        We keep information for as long as it is
                        needed to operate MoonStore, provide the
                        services requested, and handle relevant
                        account or order activities.
                    </p>

                    <p className={styles.sectionText}>
                        When a Seller requests account deletion,
                        their store, products, categories, and
                        conversations are deleted. A Seller cannot
                        delete their account while an order still
                        has money held in escrow.
                    </p>

                    <p className={styles.sectionText}>
                        We retain a limited account-deletion record
                        to understand why Sellers leave MoonStore.
                        This record contains the Seller's business
                        name, email address, WhatsApp number, reason
                        for deleting the account, and the date of
                        deletion.
                    </p>

                    <p className={styles.sectionText}>
                        Other Seller account information is deleted
                        as part of the account deletion process,
                        subject to any information that must be
                        retained under applicable law.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        9. Your Rights
                    </h2>

                    <p className={styles.sectionText}>
                        You can ask us about the personal information
                        we hold about you and request that inaccurate
                        information be corrected.
                    </p>

                    <p className={styles.sectionText}>
                        Sellers can update their store information
                        through their dashboard settings and can
                        request permanent account deletion, subject
                        to the account deletion conditions described
                        in this policy.
                    </p>

                    <p className={styles.sectionText}>
                        Buyers can report an order conversation to
                        MoonStore support or raise a dispute through
                        the order chat. Reporting an issue may pause
                        the release of held funds while the matter
                        is reviewed.
                    </p>

                    <p className={styles.sectionText}>
                        Some information may need to be retained
                        where required by applicable law or where
                        necessary to handle an ongoing matter.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        10. Changes to This Policy
                    </h2>

                    <p className={styles.sectionText}>
                        We may update this Privacy Policy from time
                        to time. The date at the top of this page
                        shows when it was last updated. We encourage
                        users to review this page periodically to
                        stay informed about how their information
                        is handled.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        11. Contact Us
                    </h2>

                    <p className={styles.sectionText}>
                        If you have questions about this Privacy
                        Policy or how we handle your personal
                        information, contact us via WhatsApp at
                        +2349126664419.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
