import styles from "./AcceptableUsePage.module.css";
import { useNavigate } from "react-router-dom";

function AcceptableUsePage() {
    const navigate = useNavigate();
    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
                ← Back
            </button>
            <div className={styles.content}>
                <h1 className={styles.title}>Acceptable Use Policy</h1>
                <p className={styles.updated}>Last updated: July 1, 2026</p>

                <p className={styles.intro}>
                    MoonStore provides an online storefront platform that
                    allows independent sellers to list and sell products
                    directly to buyers. By registering as a Seller or
                    using MoonStore as a Buyer, you agree to the terms
                    below.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. Eligibility</h2>
                    <p className={styles.sectionText}>
                        Sellers must be at least 18 years old and legally
                        able to enter into binding agreements under the
                        laws of Nigeria. Sellers are solely responsible
                        for the accuracy of their business information,
                        product listings, and pricing.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        2. Prohibited Products and Services
                    </h2>
                    <p className={styles.sectionText}>
                        Sellers may not list, advertise, or sell any of
                        the following on MoonStore:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            Illegal goods or services of any kind
                        </li>
                        <li className={styles.listItem}>
                            Counterfeit or unlicensed branded goods
                        </li>
                        <li className={styles.listItem}>
                            Weapons, firearms, ammunition, or explosives
                        </li>
                        <li className={styles.listItem}>
                            Illegal drugs, controlled substances, or drug
                            paraphernalia
                        </li>
                        <li className={styles.listItem}>Stolen goods</li>
                        <li className={styles.listItem}>
                            Adult content, sexual services, or escort
                            services
                        </li>
                        <li className={styles.listItem}>
                            Live animals or endangered species products
                        </li>
                        <li className={styles.listItem}>
                            Products that infringe on intellectual
                            property rights of third parties
                        </li>
                        <li className={styles.listItem}>
                            Financial products such as loans, investment
                            schemes, or cryptocurrency trading services
                        </li>
                        <li className={styles.listItem}>
                            Any product or service that violates Nigerian
                            law or the law of the Seller's operating
                            jurisdiction
                        </li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        3. Prohibited Conduct
                    </h2>
                    <p className={styles.sectionText}>
                        Sellers and Buyers may not:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            Use the platform to harass, threaten, or
                            defraud another user
                        </li>
                        <li className={styles.listItem}>
                            Misrepresent the condition, origin, or
                            authenticity of a product
                        </li>
                        <li className={styles.listItem}>
                            Attempt to circumvent MoonStore's payment
                            system to avoid platform fees
                        </li>
                        <li className={styles.listItem}>
                            Use another person's identity, business name,
                            or bank details without authorization
                        </li>
                        <li className={styles.listItem}>
                            Attempt to interfere with, disrupt, or gain
                            unauthorized access to MoonStore's systems
                        </li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. Payments</h2>
                    <p className={styles.sectionText}>
                        All payments for orders are processed through
                        MoonStore's integrated payment system. Sellers
                        receive their proceeds directly to their linked
                        bank account via automatic payment splitting, less
                        MoonStore's platform commission. Sellers may not
                        request or accept payment for MoonStore orders
                        through any channel outside the platform's
                        official payment flow.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        5. Dispute Resolution
                    </h2>
                    <p className={styles.sectionText}>
                        Buyers may report an issue with an order directly
                        within the chat for that order. MoonStore reviews
                        reported disputes and may contact both parties to
                        help resolve the matter. MoonStore reserves the
                        right to deactivate a Seller's store while a
                        dispute is under review.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. Enforcement</h2>
                    <p className={styles.sectionText}>
                        MoonStore reserves the right to suspend,
                        deactivate, or permanently remove any Seller or
                        Buyer account found to violate this policy, at
                        its sole discretion, with or without prior notice.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        7. Reporting Violations
                    </h2>
                    <p className={styles.sectionText}>
                        If you believe a Seller or Buyer has violated
                        this policy, please contact us via WhatsApp
                        at +2348152905325.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        8. Changes to This Policy
                    </h2>
                    <p className={styles.sectionText}>
                        MoonStore may update this Acceptable Use Policy
                        from time to time. Continued use of the platform
                        after changes are posted constitutes acceptance
                        of the updated policy.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AcceptableUsePage;