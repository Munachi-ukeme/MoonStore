import { useState } from "react";
import styles from "./FAQSection.module.css";

const faqs = [
    {
        question: "What is MoonStore?",
        answer: "MoonStore is a fashion e-commerce platform that provides a safer way to buy and sell fashion online. It helps fashion vendors showcase their products, receive orders and payments, and manage sales with less stress, while giving buyers a safer and easier way to shop for fashion.",
    },
    {
        question: "Is MoonStore a registered business?",
        answer: "Yes. MoonStore is registered with the Corporate Affairs Commission (CAC) under the business name MoonStore Branded Stores Technologies.",
    },
    {
        question: "Is it free to create a store?",
        answer: "Yes. Creating and setting up your MoonStore is free. There is no setup fee or monthly subscription. However, transaction fees apply when you receive orders and payments.",
    },
    {
        question: "How much does MoonStore charge?",
        answer: "MoonStore charges a 4% platform commission on the product price, with a minimum of ₦500 and a maximum of ₦5,000 per transaction. This commission is deducted from the seller's payout. Buyers also pay the applicable delivery fee and EscrowPay processing fee.",
    },
    {
        question: "How do I receive my money?",
        answer: "When a buyer pays, the money is held through the EscrowPay process by Rubies Microfinance Bank Limited. After the buyer confirms delivery, the funds are released to your payout account according to the applicable escrow rules and dispute process.",
    },
    {
        question: "Who holds the buyer's money?",
        answer: "Rubies Microfinance Bank Limited holds the escrow funds through the EscrowPay process. Rubies MFB is licensed by the Central Bank of Nigeria. MoonStore does not hold the buyer's money.",
    },
    {
        question: "Who handles delivery?",
        answer: "You handle delivery using your preferred delivery person or service. MoonStore does not operate its own delivery fleet, so you are responsible for arranging delivery and getting the order to the buyer.",
    },
    {
        question: "What happens after a buyer pays?",
        answer: "You receive an email and SMS notification when an order is paid. You are expected to mark the order as shipped and arrange delivery within 48 hours of payment. If you do not ship within that time, the buyer may be refunded according to the applicable rules.",
    },
    {
        question: "How does the parcel code work?",
        answer: "When you mark an order as shipped, MoonStore generates a parcel code and sends it to both you and the buyer through the order chat. Write the code on the package. When the buyer receives the parcel, they check that the code on the package matches the one in their chat and enter it to confirm delivery.",
    },
    {
        question: "Does MoonStore ask for my NIN or BVN?",
        answer: "Buyers and sellers must provide their NIN and date of birth for identity verification through EscrowPay. Buyers need this verification to support refunds to the account used for payment, while sellers need it for payout account setup. MoonStore does not store or log your NIN or date of birth, and does not request your BVN as part of this process.",
    },
    {
        question: "Do I need technical skills or my own website?",
        answer: "No. MoonStore gives you a ready-made branded online store to display your fashion products and receive orders. You do not need to know how to code, hire a developer, or manage website hosting.",
    },
    {
        question: "Is the MoonStore marketplace available?",
        answer: "Not yet. Marketplace discovery is coming soon. For now, you can share your own MoonStore store link and product links with customers.",
    },
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex((current) => (current === index ? null : index));
    };

    return (
        <section className={styles.section} id="faqs">
            <div className={styles.headingGroup}>
                <span className={styles.eyebrow}>NEED TO KNOW MORE?</span>
                <h2 className={styles.heading}>Frequently asked questions</h2>
                <p className={styles.subheading}>
                    Quick answers to common questions about buying and selling on MoonStore.
                </p>
            </div>

            <div className={styles.list}>
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    const answerId = `moonstore-faq-answer-${index}`;

                    return (
                        <article
                            className={`${styles.item} ${isOpen ? styles.open : ""}`}
                            key={faq.question}
                        >
                            <button
                                className={styles.questionBtn}
                                type="button"
                                onClick={() => toggleFAQ(index)}
                                aria-expanded={isOpen}
                                aria-controls={answerId}
                            >
                                <span className={styles.questionText}>
                                    {faq.question}
                                </span>
                                <span className={styles.icon} aria-hidden="true">
                                    {isOpen ? "−" : "+"}
                                </span>
                            </button>

                            {isOpen && (
                                <p className={styles.answer} id={answerId}>
                                    {faq.answer}
                                </p>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default FAQSection;
