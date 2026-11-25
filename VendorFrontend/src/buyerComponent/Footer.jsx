
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = ({ store }) => {
    return (
        <footer className={styles.footer}>
            {/* Logo */}
            {store?.logo && (
                <img
                    src={store.logo}
                    alt={`${store?.businessName || "Store"} logo`}
                    className={styles.logo}
                />
            )}

            {/* Business name */}
            {store?.businessName && (
                <h3 className={styles.businessName}>
                    {store.businessName}
                </h3>
            )}

            {/* Tagline */}
            {store?.tagline && (
                <p className={styles.tagline}>
                    {store.tagline}
                </p>
            )}

            <div className={styles.divider} />

            {/* Contact */}
            <div className={styles.contact}>
                {store?.whatsappNumber && (
                    <a
                        href={`https://wa.me/${store.whatsappNumber.replace(/\D/g, "")}`}
                        className={styles.contactLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        💬 WhatsApp: {store.whatsappNumber}
                    </a>
                )}

                {store?.phoneNumber && (
                    <a
                        href={`tel:${store.phoneNumber}`}
                        className={styles.contactLink}
                    >
                        📞 Call: {store.phoneNumber}
                    </a>
                )}

                {store?.address && (
                    <p className={styles.address}>
                        📍 {store.address}
                    </p>
                )}
            </div>

            <div className={styles.divider} />

            {/* Legal links */}
            <nav className={styles.legal} aria-label="Footer navigation">
                <Link className={styles.legalLink} to="/aboutus">
                    About Us
                </Link>

                <Link className={styles.legalLink} to="/privacypolicy">
                    Privacy Policy
                </Link>

                <Link className={styles.legalLink} to="/termsofservice">
                    Terms of Service
                </Link>

                <Link className={styles.legalLink} to="/acceptableusepolicy">
                    Acceptable Use Policy
                </Link>

                <Link className={styles.legalLink} to="/refund-rules">
                    Refund Rules
                </Link>
            </nav>

            {/* Powered by */}
            <p className={styles.poweredBy}>
                Powered by{" "}
                <span className={styles.moonstore}>MoonStore</span>
            </p>
        </footer>
    );
};

export default Footer;
