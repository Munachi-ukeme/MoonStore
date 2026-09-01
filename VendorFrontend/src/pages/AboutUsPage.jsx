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
                    that every business owner in Africa, big or small,
                    deserves a professional online store. Not a
                    marketplace. Not a shared app. Your own store, with
                    your name on it, working for you every hour of
                    every day.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Vision</h2>
                    <p className={styles.sectionText}>
                        A future where every African business owner,
                        big or small, literate or not runs their
                        business through a professional online store,
                        and Africa leads its own digital commerce
                        revolution instead of watching from the outside.
                        Technology is moving fast. We refuse to let
                        Africa be left behind.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Mission</h2>
                    <p className={styles.sectionText}>
                        To make online stores accessible to every African
                        vendor regardless of size, technical knowledge or
                        budget, so that owning a professional storefront
                        is not a luxury reserved for big businesses but a
                        foundation available to everyone who has something
                        to sell.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Why We Exist</h2>
                    <p className={styles.sectionText}>
                        Every day, thousands of vendors across Africa sell
                        through screenshots, DMs and disappearing status
                        updates. Buyers get lost in the back and forth.
                        Sales slip away in silence. Good products go
                        unnoticed because the system around them is broken.
                        We built MoonStore to fix that, a store that is
                        always open, where buyers browse, chat and pay
                        all in one place, and every message in your inbox
                        is a buyer who is ready to order.
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
        Munachi Ukeme Favour is a 19-year-old cybersecurity student at
        MIVA Open University and a certified MERN Stack developer,
        based in Lagos, Nigeria. He is the sole founder and builder
        behind MoonStore, MOONSTORE BRANDED STORES TECHNOLOGIES, designing
        and developing the entire platform from the ground up: the
        storefronts, the real-time chat, the payments, and everything
        in between.
    </p>
    <p className={styles.sectionText}>
        His path into tech started with a simple observation, watching
        vendors around him lose sales every day to slow DM replies and
        disappearing status updates, even when their products were
        genuinely good. That gap between good products and broken
        buying experiences became the problem he decided to solve.
    </p>
    <p className={styles.sectionText}>
        MoonStore is Munachi's first company, but not his last. His
        long-term vision is to help Africa fully embrace digital
        commerce, starting with vendors, and to keep building tools
        that solve real problems African businesses face every day.
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