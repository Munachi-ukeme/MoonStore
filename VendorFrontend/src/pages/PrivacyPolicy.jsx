import styles from "./PrivacyPolicy.module.css";
import { useNavigate } from "react-router-dom";

function PrivacyPolicy(){
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    return(
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={handleBack}>
                ←
            </button>
            <div className={styles.content}>
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.updated}>Last updated: October 2026</p>

                <p className={styles.intro}>
                    MoonStore is committed to protecting your privacy. This
                    policy explains how we collect, use, and protect your
                    information when you use our platform, whether you are a seller managing your own store, a buyer browsing the
                    marketplace, or ordering directly from a seller's store.
                    
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Who We Are</h2>
                    <p className={styles.sectionText}>
                        MoonStore is operated by MoonStore Branded Stores
                        Technologies, a company registered with the
                        Corporate Affairs Commission (CAC) in Nigeria. We
                        give African fashion vendors their own branded
                        online store.  Sellers sell independently
                        through their own store, and their products can also
                        be discovered through the MoonStore marketplace. Buyers order from a seller's store
                        through MoonStore's built-in chat, and payments are
                        held in escrow until delivery is confirmed.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
                    <p className={styles.sectionText}>
                        For sellers, we collect business name, email,
                        password (hashed), WhatsApp number, phone number,
                        address, bank account details for payouts, and the
                        delivery options you set for your store.
                    </p>
                    <p className={styles.sectionText}>
                        For buyers, we collect email (required before
                        ordering), name, delivery address, city, phone
                        number, and delivery zone selection. You are never
                        required to create a full MoonStore account, your
                        identity is tracked by email and session.
                    </p>
                    <p className={styles.sectionText}>
                        <strong>Identity verification.</strong> Payments on
                        MoonStore are held in a dedicated virtual account at
                        Rubies Microfinance Bank, a Central Bank of Nigeria
                        (CBN) licensed institution, through our escrow
                        provider EscrowPay. Because Rubies is a regulated
                        bank, it is legally required to verify the identity
                        of anyone it opens an account for. For this reason,
                        buyers are asked to verify once before their first
                        payment, and sellers are verified once before they
                        can receive payments. We ask for your National
                        Identification Number (NIN) and your date of birth,
                        which must match your NIN record. We do not ask for
                        your BVN. Your NIN and date of birth are sent
                        directly to our escrow provider for verification,
                        and MoonStore does not store or log them. We keep
                        only a reference ID from our escrow provider that
                        identifies your verified profile, and a record of
                        whether verification succeeded.
                    </p>
                    <p className={styles.sectionText}>
                        When you place an order, we keep a record of exactly
                        what was ordered at that moment (product name,
                        price, image, colour, size, and quantity). This
                        record is used to resolve disputes fairly, even if
                        the seller later changes or removes the product.
                    </p>
                    <p className={styles.sectionText}>
                        When a seller marks an order as shipped, we generate
                        a delivery PIN, show it to the buyer in the order
                        chat, and send it by SMS to the delivery phone
                        number. Sellers cannot see the PIN.
                    </p>
                    <p className={styles.sectionText}>
                        We also collect the messages and images sent in
                        order chats (images are compressed), anonymous
                        session data, and basic analytics such as store
                        visits, product clicks, and sales performance, to
                        help sellers understand how their store is doing.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
                    <p className={styles.sectionText}>
                        We use seller information to create and manage your
                        storefront, show your products to buyers, process
                        and release payments, and communicate with you about
                        your account. We use buyer information to process
                        orders, hold and release payments, send delivery
                        PINs and order notifications, and resolve disputes.
                        We use identity verification only to open the secure
                        payment account described above. We do not sell your
                        information to any third party.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. Who Can See Your Information</h2>
                    <p className={styles.sectionText}>
                        When you order from a seller, that seller can see
                        your name, delivery address, phone number, and the
                        messages in your order chat, because they need them
                        to deliver your order. If a conversation is reported
                        or an order is disputed, MoonStore support can read
                        the conversation and join it to review the matter.
                        Buyers can see the name and phone number of the delivery person that the seller enters when marking an order as shipped.
                        We also keep a count of disputes raised by and
                        against buyers and sellers to help us identify
                        abuse.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. Images and Files</h2>
                    <p className={styles.sectionText}>
                        Product images and store logos uploaded by sellers
                        are stored securely on Cloudinary. These images are
                        publicly visible on your storefront.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Data Security</h2>
                    <p className={styles.sectionText}>
                        Seller passwords are encrypted and never stored in
                        plain text. All data is transmitted over secure
                        HTTPS connections. Your NIN and date of birth are
                        passed to our escrow provider only to complete
                        verification and are not stored by MoonStore.
                        Payment notifications from our escrow provider are
                        cryptographically verified before we trust them.
                        Delivery PINs are limited to a few attempts per
                        hour. Bank account numbers shared in chat are
                        automatically blocked.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>7. Third Party Services</h2>
                    <p className={styles.sectionText}>
                        MoonStore uses the following trusted partners to
                        operate the platform:
                    </p>
                    <p className={styles.sectionText}>
                        <strong>EscrowPay</strong> handles payment
                        processing, identity verification, and escrow
                        holding, your payment is held securely until
                        delivery is confirmed, rather than sent directly to
                        the seller. EscrowPay's banking partner, Rubies
                        Microfinance Bank (CBN-licensed), is where funds are
                        actually held. EscrowPay uses Prembly for identity
                        verification, MoonStore does not interact with
                        Prembly directly. We also use Cloudinary for image
                        hosting, MongoDB Atlas for database hosting, Vercel
                        and Render to host our website and servers, Resend
                        for transactional emails, and Termii for SMS
                        delivery (such as delivery PINs and dispute
                        notices).
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>8. Data Retention</h2>
                    <p className={styles.sectionText}>
                        Conversation history tied to a paid order is kept
                        for as long as needed to preserve delivery PINs,
                        dispute evidence, and order history. Escrow holds
                        can run longer than a few days, so chats are not
                        automatically deleted. Transaction records are kept
                        as the backbone of order history, review
                        eligibility, and dispute resolution.
                    </p>
                    <p className={styles.sectionText}>
                        If a seller deletes their account, their store,
                        products, categories, and conversations are removed.
                        The reason they give for leaving is kept, along with
                        their business name and contact details, so we can
                        learn why sellers leave. A store cannot be deleted
                        while any order still has money held in escrow.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>9. Your Rights</h2>
                    <p className={styles.sectionText}>
                        As a seller, you can update your store information
                        at any time through your dashboard settings, and
                        delete your account permanently, which removes your
                        store, products, and categories from our system.
                    </p>
                    <p className={styles.sectionText}>
                        As a buyer, you can report a conversation to
                        MoonStore admin, or raise a dispute, which pauses
                        fund release until the matter is reviewed.
                    </p>
                    <p className={styles.sectionText}>
                        You can also contact us to ask what personal
                        information we hold about you, or to have it
                        corrected or deleted. We may need to keep some
                        records, such as transactions and dispute history,
                        for financial record-keeping, fraud prevention, and
                        dispute resolution.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>10. Changes to This Policy</h2>
                    <p className={styles.sectionText}>
                        We may update this policy from time to time. The
                        date at the top of this page shows when it was last
                        changed.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>11. Contact Us</h2>
                    <p className={styles.sectionText}>
                        If you have any questions about this privacy policy
                        or how we handle your data, contact us directly on
                        WhatsApp at +2349126664419. We respond to every
                        message personally.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;