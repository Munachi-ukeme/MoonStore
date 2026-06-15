import { useNavigate } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = ({ store }) => {
    const navigate = useNavigate();

    return (
        <div className={styles.footer}>

            {/* logo */}
            {store?.logo ? (
                <img
                    src={store.logo}
                    alt={store?.businessName}
                    className={styles.logo}
                />
            ) : null}

            {/* business name */}
            <h3 className={styles.businessName}>{store?.businessName}</h3>

            {/* tagline */}
            {store?.tagline ? (
                <p className={styles.tagline}>{store.tagline}</p>
            ) : null}

            {/* divider */}
            <div className={styles.divider} />

            {/* contact */}
            <div className={styles.contact}>
                {store?.whatsappNumber ? (
                    <a
                        href={`https://wa.me/${store.whatsappNumber}`}
                        className={styles.contactLink}
                        target="_blank"
                        rel="noreferrer"
                    >
                        💬 WhatsApp: {store.whatsappNumber}
                    </a>
                ) : null}

                {store?.phoneNumber ? (
                    <a
                        href={`tel:${store.phoneNumber}`}
                        className={styles.contactLink}
                    >
                        📞 Call: {store.phoneNumber}
                    </a>
                ) : null}

                {store?.address ? (
                    <p className={styles.address}>📍 {store.address}</p>
                ) : null}
            </div>

            {/* divider */}
            <div className={styles.divider} />

            {/* legal */}
            <div className={styles.legal}>
                <button
                    className={styles.legalLink}
                    onClick={() => navigate("/privacypolicy")}
                >
                    Privacy Policy
                </button>
                <span className={styles.dot}>·</span>
                <button
                    className={styles.legalLink}
                    onClick={() => navigate("/termsofservice")}
                >
                    Terms of Service
                </button>
            </div>

            {/* powered by */}
            <p className={styles.poweredBy}>
                Powered by <span className={styles.moonstore}>MoonStore</span>
            </p>

        </div>
    );
};

export default Footer;