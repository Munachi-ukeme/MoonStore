import { useState } from "react";
import styles from "./FAQSection.module.css";

const faqs = [
    {
        question: "What is MoonStore?",
        answer: "MoonStore is a fashion e-commerce platform that helps fashion vendors sell smarter, reduce the stress of managing sales, and grow their businesses online, while giving buyers a safer and easier way to shop for fashion.",
    },
    {
        question: "Is MoonStore a registered business?",
        answer: "Yes. MoonStore is registered with the Corporate Affairs Commission under the business name MoonStore Branded Stores Technologies.",
    },
    {
        question: "Is it free to create a store?",
        answer: "Yes. Creating and setting up your MoonStore is free. There is no setup fee or monthly subscription.",
    },
    {
        question: "How much does MoonStore charge?",
        answer: "MoonStore charges a 4% platform commission on the product price, with a minimum of ₦500 and a maximum of ₦5,000 per transaction. The commission is deducted from the seller's payout. Buyers also pay the applicable delivery fee and EscrowPay processing fee.",
    },
    {
        question: "How do I receive my money?",
        answer: "Buyer payments are held through the escrow process. Funds are released according to the order's delivery and confirmation status and the applicable dispute period.",
    },
    {
        question: "Who holds the buyer's money?",
        answer: "Rubies Microfinance Bank Limited holds the escrow funds through the EscrowPay process. MoonStore does not hold the escrow funds itself.",
    },
    {
        question: "Who handles delivery?",
        answer: "You arrange delivery using your preferred delivery person. MoonStore does not operate its own delivery fleet.",
    },
    {
        question: "What happens after a buyer pays?",
        answer: "You receive an email and SMS notification asking you to mark the order as shipped and arrange delivery within 48 hours of payment. If you do not mark it as shipped within that time, the buyer is refunded.",
    },
    {
        question: "How does the parcel code work?",
        answer: "When you mark an order as shipped, MoonStore generates a parcel code and sends it to both you and the buyer in the order chat. Write the code on the package. The buyer checks that it matches the code in their chat and enters it to confirm receipt.",
    },
    {
        question: "Does MoonStore ask for my NIN or BVN?",
        answer: "EscrowPay requires identity information for seller payout account setup. Your NIN and date of birth are sent to EscrowPay for verification. MoonStore does not store or log your NIN or date of birth. MoonStore does not request your BVN as part of this process.",
    },
    {
        question: "Do I need technical skills or my own website?",
        answer: "No. MoonStore gives you a ready-made branded online store. You do not need to code, hire a developer or manage website hosting.",
    },
    {
        question: "Is the MoonStore marketplace available?",
        answer: "Not yet. Marketplace discovery is coming soon. For now, you can share your own MoonStore store and product links with customers.",
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
                <p className={styles.subheading}>Quick answers to common questions about selling on MoonStore.</p>
            </div>

            <div className={styles.list}>
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    const answerId = `moonstore-faq-answer-${index}`;

                    return (
                        <article className={`${styles.item} ${isOpen ? styles.open : ""}`} key={faq.question}>
                            <button
                                className={styles.questionBtn}
                                type="button"
                                onClick={() => toggleFAQ(index)}
                                aria-expanded={isOpen}
                                aria-controls={answerId}
                            >
                                <span className={styles.questionText}>{faq.question}</span>
                                <span className={styles.icon} aria-hidden="true">{isOpen ? "−" : "+"}</span>
                            </button>
                            {isOpen && (
                                <p className={styles.answer} id={answerId}>{faq.answer}</p>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default FAQSection;
