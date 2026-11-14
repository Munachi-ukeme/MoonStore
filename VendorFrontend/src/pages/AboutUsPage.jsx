import styles from "./AboutUsPage.module.css";
import { useNavigate } from "react-router-dom";

function AboutUsPage() {
    const navigate = useNavigate();
    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
                ←
            </button>
            <div className={styles.content}>
                <h1 className={styles.title}>About MoonStore</h1>

                <p className={styles.intro}>
                    MoonStore was built on a simple but powerful belief,
                    that every African fashion vendor, big or small,
                    deserves a professional online store, with their own
                    name on it, working for them every hour of every day.
                    Sell independently through your own store. Get
                    discovered collectively through the MoonStore
                    marketplace.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Vision</h2>
                    <p className={styles.sectionText}>
                        A future where Africa leads its own digital commerce
                        revolution, starting with the African fashion
                        vendor who no longer needs a shop, a roadside
                        stall, or a spot in a crowded market to run a real
                        business. Upload from home, sell online, get paid
                        securely, and grow into whatever it becomes next.
                        Technology is moving fast. We refuse to let Africa,
                        or the vendor selling from her living room, be left
                        behind.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Mission</h2>
                    <p className={styles.sectionText}>
                        To give African fashion vendors their own branded
                        online store, backed by marketplace discovery and
                        escrow-protected payments, so that selling online
                        can fully replace the need for physical retail
                        space, regardless of size, technical knowledge, or
                        budget.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Why We Exist</h2>
                    <p className={styles.sectionText}>
                        Every day, fashion vendors across Africa sell
                        through screenshots, DMs and disappearing status
                        updates. Buyers get lost in the back and forth, and
                        sales slip away in silence, not because the
                        products aren't good, but because the system around
                        them is broken. We built MoonStore to fix that: a
                        store that's always open, where buyers browse,
                        chat and pay all in one place, protected by escrow
                        so a buyer never has to simply "trust" a stranger
                        with their money.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Built For Everyone</h2>
                    <p className={styles.sectionText}>
                        MoonStore was not built for tech-savvy vendors or
                        established brands. It was built for the vendor
                        just starting out, the one who has been selling
                        through DMs for years and is exhausted, and the
                        one who never believed a proper online store was
                        available to someone at her level. No code. No
                        confusing setup. No developer needed. If you have
                        something to sell, MoonStore was built for you.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Meet the Founder</h2>
                    <p className={styles.sectionText}>
                        Munachi Ukeme Favour is a 19-year-old cybersecurity
                        student at MIVA Open University and a certified
                        MERN Stack developer, based in Lagos, Nigeria. He
                        is the sole founder and builder behind MoonStore,
                        MOONSTORE BRANDED STORES TECHNOLOGIES, designing
                        and developing the entire platform from the ground
                        up: the storefronts, the marketplace, the real-time
                        chat, and the escrow-protected payments.
                    </p>
                    <p className={styles.sectionText}>
                        His path into tech started with a simple
                        observation, watching vendors around him lose sales
                        every day to slow DM replies and disappearing
                        status updates, even when their products were
                        genuinely good. That gap between good products and
                        broken buying experiences became the problem he
                        decided to solve.
                    </p>
                    <p className={styles.sectionText}>
                        MoonStore is Munachi's first company, but not his
                        last. His long-term vision is to help Africa fully
                        embrace digital commerce, starting with fashion
                        vendors, and to keep building tools that solve real
                        problems African businesses face every day.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Promise</h2>
                    <p className={styles.sectionText}>
                        Your store. Your rules. We are committed to
                        building a platform that grows with every vendor
                        who trusts us, from your first sale to your
                        thousandth, and from Nigeria to every corner
                        of Africa.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AboutUsPage;