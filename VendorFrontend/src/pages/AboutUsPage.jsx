
import styles from "./AboutUsPage.module.css";
import { useNavigate } from "react-router-dom";

function AboutUsPage() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <button
                className={styles.backBtn}
                onClick={() => navigate("/dashboard")}
                aria-label="Go back"
            >
                ←
            </button>

            <div className={styles.content}>
                <h1 className={styles.title}>About MoonStore</h1>

                <p className={styles.intro}>
                    MoonStore is a fashion e-commerce platform built to
                    provide a safer way to buy and sell fashion online.
                    We help fashion vendors showcase their products,
                    receive orders and payments, and reduce the stress
                    of managing sales, while giving buyers a safer and
                    easier way to shop for fashion. Through individual
                    vendor stores and escrow-protected payments, we're
                    making online fashion buying and selling easier.
                    We're also working on a marketplace where buyers
                    will be able to discover products from different
                    MoonStore vendors.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Vision</h2>
                    <p className={styles.sectionText}>
                        A future where African fashion businesses can
                        grow beyond the limits of physical shops and
                        social media, and where people can discover and
                        buy fashion online with greater confidence.
                        We want vendors to reach more customers and
                        build successful businesses online, while
                        making fashion shopping safer and easier
                        for buyers across Africa.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Mission</h2>
                    <p className={styles.sectionText}>
                        To help fashion vendors sell smarter, spend
                        less time managing sales, and grow their
                        businesses online, while giving buyers a safer
                        and easier way to shop for fashion. We do this
                        through individual vendor stores, online
                        ordering, and an escrow-protected payment
                        process designed to provide clearer rules
                        for both buyers and sellers.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Why We Exist</h2>

                    <p className={styles.sectionText}>
                        Selling fashion online should not mean spending
                        the whole day answering the same questions,
                        searching through messages, confirming payments,
                        and trying to keep track of orders. Vendors
                        have businesses to run, but managing sales
                        through scattered conversations can make
                        things harder than they need to be.
                    </p>

                    <p className={styles.sectionText}>
                        Buyers also face problems. Someone may love
                        a product but hesitate to pay because they
                        are afraid the seller might not deliver.
                        This makes it harder for genuine vendors
                        to earn the confidence of new customers.
                    </p>

                    <p className={styles.sectionText}>
                        We built MoonStore to help address these
                        problems. Vendors can display their products
                        through their own online stores, receive
                        orders and payments, and share their product
                        links with customers. We're also building a
                        marketplace where buyers can discover fashion
                        products from different vendors. With our
                        escrow-protected payment process, buyers and
                        sellers have defined rules for delivery
                        confirmation, payment release, and handling
                        reported issues.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Built for Vendors and Buyers
                    </h2>

                    <p className={styles.sectionText}>
                        MoonStore is built for fashion vendors who
                        want a better and safer way to sell online.
                        Whether you sell clothes, shoes, bags,
                        fabrics, hair, or other fashion products,
                        you can have your own online store to display
                        what you sell, share your products, and
                        receive orders from customers.
                    </p>

                    <p className={styles.sectionText}>
                        We also make it easier for buyers to discover
                        fashion products from different vendors through
                        our marketplace. Instead of depending only on
                        social media posts, buyers have another place
                        to explore products and visit individual
                        vendor stores.
                    </p>

                    <p className={styles.sectionText}>
                        And because paying an unfamiliar online
                        seller can be worrying, our escrow-protected
                        payment process provides defined rules for
                        delivery confirmation, payment release,
                        and handling reported issues.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Meet the Founder
                    </h2>

                    <p className={styles.sectionText}>
                        Ukeme Munachi Favour is a certified full-stack
                        software developer and cybersecurity student
                        at MIVA Open University, based in Lagos,
                        Nigeria. He is the founder and developer
                        behind MoonStore, responsible for building
                        the platform and developing its core features,
                        including vendor stores, marketplace
                        functionality, real-time communication,
                        and escrow-protected payments.
                    </p>

                    <p className={styles.sectionText}>
                        His journey into building MoonStore came from
                        recognising the challenges fashion vendors
                        face when selling online. Good products can
                        attract attention, but managing customer
                        enquiries, receiving payments, and helping
                        new buyers feel confident about purchasing
                        can make selling difficult. He saw an
                        opportunity to build something that could
                        make that experience better for both
                        vendors and buyers.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore is part of his commitment to
                        building technology that solves real problems
                        faced by African businesses. Starting with
                        fashion, his goal is to contribute to a
                        future where more African businesses can
                        use technology to operate and grow.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Our Promise
                    </h2>

                    <p className={styles.sectionText}>
                        We are committed to making online fashion
                        buying and selling safer and easier for
                        everyone using MoonStore. We want vendors
                        to spend less time struggling to manage
                        sales and more time running their businesses.
                        We want buyers to discover great products
                        and shop with greater confidence, knowing
                        that their payments follow clear protection
                        rules.
                    </p>

                    <p className={styles.sectionText}>
                        We're building a platform where fashion
                        vendors can sell with less stress and buyers
                        can enjoy a safer way to shop for fashion.
                    </p>

                    <p className={styles.sectionText}>
                        <strong>
                            Buy with greater confidence. Sell with
                            less stress.
                        </strong>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AboutUsPage;
