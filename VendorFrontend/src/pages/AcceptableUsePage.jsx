
import styles from "./AcceptableUsePage.module.css";
import { useNavigate } from "react-router-dom";

function AcceptableUsePage() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <button
                className={styles.backBtn}
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>

            <div className={styles.content}>
                <h1 className={styles.title}>Acceptable Use Policy</h1>
                <p className={styles.updated}>
                    Last updated: November 2026
                </p>

                <p className={styles.intro}>
                    MoonStore is a fashion e-commerce platform that helps
                    independent fashion vendors sell through their own
                    online stores, with products also discoverable through
                    the MoonStore marketplace. This policy explains the
                    rules that Buyers and Sellers must follow when using
                    MoonStore. By accessing or using the platform, you
                    agree to follow these rules.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Eligibility</h2>
                    <p className={styles.sectionText}>
                        Sellers must be at least 18 years old and legally
                        able to enter into binding agreements under the
                        laws of Nigeria. Sellers are responsible for
                        providing accurate business information, product
                        details, prices, stock availability, and other
                        information displayed in their stores.
                    </p>
                    <p className={styles.sectionText}>
                        All users must provide accurate information when
                        creating or using an account and must not use
                        another person's identity or account without
                        authorization.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        2. Permitted Products
                    </h2>
                    <p className={styles.sectionText}>
                        MoonStore is a fashion-focused platform. Sellers
                        may list clothing, footwear, bags, jewelry,
                        accessories, fabrics, hair products, and other
                        legitimate fashion-related products.
                    </p>
                    <p className={styles.sectionText}>
                        Products must be accurately described and must
                        comply with applicable laws and this policy.
                        MoonStore may remove listings that fall outside
                        the platform's permitted categories.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        3. Prohibited Products and Services
                    </h2>
                    <p className={styles.sectionText}>
                        Sellers must not list, advertise, or sell any of
                        the following on MoonStore:
                    </p>

                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            Illegal goods or services of any kind.
                        </li>
                        <li className={styles.listItem}>
                            Counterfeit products or products falsely
                            presented as genuine branded goods.
                        </li>
                        <li className={styles.listItem}>
                            Stolen goods or goods obtained unlawfully.
                        </li>
                        <li className={styles.listItem}>
                            Adult content, sexual services, or escort
                            services.
                        </li>
                        <li className={styles.listItem}>
                            Products made from endangered species or
                            prohibited animal materials.
                        </li>
                        <li className={styles.listItem}>
                            Products that infringe another person's
                            intellectual property rights.
                        </li>
                        <li className={styles.listItem}>
                            Any product or service prohibited by
                            applicable Nigerian law or the laws of the
                            Seller's operating jurisdiction.
                        </li>
                    </ul>

                    <p className={styles.sectionText}>
                        MoonStore may remove prohibited listings and
                        take further action against accounts involved
                        in these activities.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        4. Prohibited Conduct
                    </h2>
                    <p className={styles.sectionText}>
                        Sellers and Buyers must not:
                    </p>

                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            Use MoonStore to harass, threaten, deceive,
                            exploit, or defraud another user.
                        </li>
                        <li className={styles.listItem}>
                            Provide false or misleading product
                            descriptions, images, prices, product
                            conditions, or delivery information.
                        </li>
                        <li className={styles.listItem}>
                            Request or accept payment outside
                            MoonStore's official payment process for
                            orders placed through the platform.
                        </li>
                        <li className={styles.listItem}>
                            Share payment instructions or bank details
                            for the purpose of bypassing MoonStore's
                            official payment process.
                        </li>
                        <li className={styles.listItem}>
                            Submit false identity information, including
                            false NIN details, or use another person's
                            identity, business information, or bank
                            details without authorization.
                        </li>
                        <li className={styles.listItem}>
                            Manipulate product stock, customer reviews,
                            ratings, orders, or other platform records.
                        </li>
                        <li className={styles.listItem}>
                            Submit false delivery confirmations or
                            fabricated evidence in a dispute.
                        </li>
                        <li className={styles.listItem}>
                            Raise dishonest, fraudulent, or
                            bad-faith disputes.
                        </li>
                        <li className={styles.listItem}>
                            Attempt to access another user's account,
                            interfere with MoonStore's systems, or
                            disrupt the platform's normal operation.
                        </li>
                        <li className={styles.listItem}>
                            Use MoonStore to engage in any activity
                            that violates applicable laws.
                        </li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        5. Payments and Escrow
                    </h2>

                    <p className={styles.sectionText}>
                        Payments made through MoonStore's official
                        EscrowPay payment process are handled through
                        our integration with EscrowPay, which partners
                        with Rubies Microfinance Bank Limited, a
                        microfinance bank licensed by the Central Bank
                        of Nigeria (CBN).
                    </p>

                    <p className={styles.sectionText}>
                        When a Buyer pays for an order through this
                        process, the money is held by Rubies Microfinance
                        Bank Limited. EscrowPay provides the technology
                        that facilitates the holding and conditional
                        release of the funds. MoonStore does not directly
                        hold the Buyer's escrow funds.
                    </p>

                    <p className={styles.sectionText}>
                        Once the Buyer confirms that the order has been
                        received, MoonStore can instruct the release of
                        the held funds to the Seller's linked bank
                        account, subject to the applicable escrow rules
                        and any relevant dispute.
                    </p>

                    <p className={styles.sectionText}>
                        If a Buyer reports a problem before the applicable
                        delivery period expires, the release of funds may
                        be paused while the issue is reviewed. If the
                        Buyer does not confirm delivery or report an
                        issue within the applicable period, the funds
                        may be released according to MoonStore's escrow
                        rules.
                    </p>

                    <p className={styles.sectionText}>
                        Sellers must not request or accept payment outside
                        the official payment process for MoonStore orders.
                        Any applicable platform commissions, payment
                        charges, and other fees will be handled according
                        to the terms displayed or communicated for the
                        relevant transaction.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        6. Dispute Resolution
                    </h2>

                    <p className={styles.sectionText}>
                        Buyers who experience a problem with an order
                        may report it through the chat associated with
                        that order before the applicable delivery period
                        expires. Reporting an issue may pause the release
                        of the held funds while the matter is reviewed.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore may request information or evidence
                        from both the Buyer and Seller, including order
                        details, conversations, product images, and
                        delivery information. Both parties are expected
                        to provide honest and relevant information and
                        cooperate during the review.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore will review the information available
                        and take action according to its applicable
                        escrow and dispute rules. The outcome may affect
                        whether funds are released to the Seller or
                        returned to the Buyer, depending on the
                        circumstances and applicable rules.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore may review or restrict an account
                        where repeated or serious disputes, dishonest
                        conduct, or policy violations are identified.
                        A Seller's store may also be temporarily
                        restricted while a serious matter is under
                        review.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        7. Enforcement
                    </h2>

                    <p className={styles.sectionText}>
                        MoonStore may remove listings, restrict platform
                        features, suspend accounts, deactivate stores,
                        or permanently terminate accounts where users
                        violate this policy or engage in activities
                        that may harm other users or the platform.
                    </p>

                    <p className={styles.sectionText}>
                        Depending on the seriousness of the violation,
                        action may be taken with or without prior notice.
                        Where appropriate, MoonStore may also take
                        further steps permitted by applicable law.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        8. Reporting Violations
                    </h2>

                    <p className={styles.sectionText}>
                        If you believe a Buyer or Seller has violated
                        this policy, or you encounter suspicious
                        activity on MoonStore, please contact us via
                        WhatsApp at +2349126664419.
                    </p>

                    <p className={styles.sectionText}>
                        When reporting an issue, provide relevant
                        information that can help us understand and
                        review the matter.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        9. Changes to This Policy
                    </h2>

                    <p className={styles.sectionText}>
                        MoonStore may update this Acceptable Use Policy
                        when necessary. Updated versions will be
                        published on the platform with a revised
                        update date.
                    </p>

                    <p className={styles.sectionText}>
                        Users are encouraged to review this policy
                        periodically. Continued use of MoonStore after
                        an updated policy takes effect means that the
                        user agrees to follow the updated rules,
                        subject to applicable law.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AcceptableUsePage;
