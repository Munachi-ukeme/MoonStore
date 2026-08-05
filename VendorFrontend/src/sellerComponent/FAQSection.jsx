import { useState } from "react";
import styles from "./FAQSection.module.css";

const faqs = [
    {
        question: "When will I receive my money?",
        answer: "As soon as a buyer pays through your Paystack link, the payment settles directly to your linked bank account based on Paystack's standard settlement schedule.",
    },
    {
        question: "How much does MoonStore charge?",
        answer: "MoonStore takes a 4% platform fee from each completed sale. There is no subscription, no setup fee, and no monthly charge.",
    },
    {
        question: "Is it free to create a store?",
        answer: "Yes. Signing up and setting up your store is completely free. You only pay the 4% fee when you actually make a sale.",
    },
    {
        question: "Is my money safe?",
        answer: "Yes. Payments go through Paystack directly into your own bank account. MoonStore does not hold your money.",
    },
    {
        question: "What happens if a buyer doesn't pay?",
        answer: "Nothing is charged. The conversation simply stays unpaid until the buyer completes payment.",
    },
    {
        question: "Do I need tech skills or my own website?",
        answer: "No. MoonStore gives you a ready-made branded store instantly — no coding, no developer, no hosting to manage.",
    },
    {
        question: "How do buyers contact me?",
        answer: "Buyers chat with you directly inside your MoonStore store — no need for them to have WhatsApp or any app.",
    },
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        if (openIndex === index) {
            setOpenIndex(null);
        } else {
            setOpenIndex(index);
        }
    };

    return (
        <div className={styles.section}>
            <p className={styles.heading}>Frequently Asked Questions</p>

            <div className={styles.list}>
                {faqs.map((faq, index) => (
                    <div key={faq.question} className={styles.item}>
                        <button
                            className={styles.questionBtn}
                            onClick={() => toggleFAQ(index)}
                        >
                            <span className={styles.questionText}>{faq.question}</span>
                            <span className={styles.icon}>
                                {openIndex === index ? "−" : "+"}
                            </span>
                        </button>

                        {openIndex === index ? (
                            <p className={styles.answer}>{faq.answer}</p>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQSection;