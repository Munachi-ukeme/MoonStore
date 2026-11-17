
import styles from "./AboutUsPage.module.css";
import { useNavigate } from "react-router-dom";

function AboutUsPage() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <button
                className={styles.backBtn}
                onClick={() => navigate("/dashboard")}
            >
                ←
            </button>

            <div className={styles.content}>
                <h1 className={styles.title}>About MoonStore</h1>

                <p className={styles.intro}>
                    MoonStore is a fashion e-commerce platform built to
                    make buying and selling fashion online easier and
                    safer. We help fashion vendors sell smarter, reduce
                    the stress of managing sales, and grow their
                    businesses online, while giving buyers a safer and
                    easier way to shop for fashion. Through individual
                    online stores, marketplace discovery, and
                    escrow-protected payments, we are creating a better
                    way for vendors and buyers to do business.
                </p>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Vision</h2>
                    <p className={styles.sectionText}>
                        A future where African fashion businesses can
                        grow beyond the limits of physical shops and
                        social media, and where people can discover and
                        buy fashion online without unnecessary fear or
                        difficulty. We want to make it easier for vendors
                        to reach customers and build successful
                        businesses online, while making fashion shopping
                        safer and more convenient for buyers across
                        Africa.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Mission</h2>
                    <p className={styles.sectionText}>
                        To help fashion vendors sell smarter, spend less
                        time struggling to manage sales, and grow their
                        businesses online, while giving buyers a safer
                        and easier way to discover and purchase fashion
                        products. We do this through individual vendor
                        stores, marketplace discovery, and an
                        escrow-protected payment process designed to
                        protect both buyers and sellers.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Why We Exist</h2>
                    <p className={styles.sectionText}>
                        Selling fashion online should not mean spending
                        the whole day answering the same questions,
                        searching through messages, confirming payments,
                        and trying to keep track of orders. Vendors have
                        businesses to run, but managing sales through
                        scattered conversations can make things harder
                        than they need to be.
                    </p>

                    <p className={styles.sectionText}>
                        Buyers also face problems. Someone may love a
                        product but hesitate to pay because they are
                        afraid the seller might not deliver. This makes
                        it harder for genuine vendors to earn the trust
                        of new customers.
                    </p>

                    <p className={styles.sectionText}>
                        We built MoonStore to help solve these problems.
                        Vendors can display their products through their
                        own online stores, receive orders, and reach
                        potential customers through our marketplace.
                        Buyers can discover products and shop through a
                        clearer buying process, with payments protected
                        by our escrow system and its defined delivery,
                        payout, and dispute rules.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Built for Vendors and Buyers
                    </h2>

                    <p className={styles.sectionText}>
                        MoonStore is built for fashion vendors who want
                        a better way to sell and grow their businesses
                        online. Whether you sell clothes, shoes, bags,
                        fabrics, hair, or other fashion products, you
                        can have your own online store to display what
                        you sell and receive orders from customers.
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
                        And because paying an unfamiliar online seller
                        can be worrying, our escrow-protected payment
                        process gives buyers and sellers defined rules
                        for delivery confirmation, payment release,
                        and handling reported issues.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Meet the Founder</h2>

                    <p className={styles.sectionText}>
                        Ukeme Munachi Favour is a  Certified Full Stack
                        Software developer and cybersecurity student
                        at MIVA Open University based in Lagos, Nigeria. He is
                        the founder and developer behind MoonStore,
                        responsible for building the platform and
                        developing its core features, including vendor
                        stores, marketplace functionality, real-time
                        communication, and escrow-protected payments.
                    </p>

                    <p className={styles.sectionText}>
                        His journey into building MoonStore came from
                        recognising the challenges fashion vendors
                        face when selling online. Good products can
                        attract attention, but managing customer
                        enquiries, receiving payments, and earning the
                        trust of new buyers can make selling difficult.
                        He saw an opportunity to build something that
                        could make that experience better for both
                        vendors and buyers.
                    </p>

                    <p className={styles.sectionText}>
                        MoonStore is part of his commitment to building
                        technology that solves real problems faced by
                        African businesses. Starting with fashion,
                        his goal is to contribute to a future where
                        more African businesses can use technology to
                        operate and grow.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Promise</h2>

                    <p className={styles.sectionText}>
                        We are committed to making online fashion
                        commerce easier and safer for everyone using
                        MoonStore. We want vendors to spend less time
                        struggling to manage sales and more time
                        growing their businesses. We want buyers to
                        discover great products and shop with greater
                        confidence, knowing that their payments follow
                        clear protection rules.
                    </p>

                    <p className={styles.sectionText}>
                        We are building a platform where vendors can
                        grow their businesses and buyers can enjoy a
                        better way to shop for fashion.
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
