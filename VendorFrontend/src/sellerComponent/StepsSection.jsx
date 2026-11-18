import styles from "./StepsSection.module.css";

const steps = [
    {
        number: "01",
        title: "Create your seller account",
        text: "Sign up with your business details and complete the required identity verification and payout setup.",
    },
    {
        number: "02",
        title: "Set up your store",
        text: "Add your logo, banner, business details, products, prices and categories.",
    },
    {
        number: "03",
        title: "Share your store link",
        text: "Share your store and product links on WhatsApp, Instagram, TikTok and other platforms where your customers find you.",
    },
    {
        number: "04",
        title: "Receive paid orders",
        text: "When a buyer pays, you receive an email and SMS notification telling you to prepare and ship the order.",
    },
    {
        number: "05",
        title: "Ship within 48 hours",
        text: "Arrange delivery with your preferred delivery person and mark the order as shipped within 48 hours of payment. If you don't, the buyer is refunded.",
    },
];

const StepsSection = () => (
    <section className={styles.section} id="how-it-works">
        <div className={styles.headingGroup}>
            <span className={styles.eyebrow}>GET STARTED</span>
            <h2 className={styles.heading}>How to start selling on MoonStore</h2>
            <p className={styles.subheading}>Five simple steps to start selling online.</p>
        </div>

        <div className={styles.list}>
            {steps.map((step) => (
                <article className={styles.step} key={step.number}>
                    <div className={styles.numberCircle}>{step.number}</div>
                    <div className={styles.stepText}>
                        <h3 className={styles.stepTitle}>{step.title}</h3>
                        <p className={styles.stepDesc}>{step.text}</p>
                    </div>
                </article>
            ))}
        </div>
        <p className={styles.deadlineNote}>
            The 48-hour deadline is for marking an order as shipped. Delivery itself may take longer,
            depending on the delivery arrangement.
        </p>
    </section>
);

export default StepsSection;
