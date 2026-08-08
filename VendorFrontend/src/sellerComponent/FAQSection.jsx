import { useState } from "react";
import styles from "./FAQSection.module.css";

const faqs = [

     {
        question: "What is MoonStore?",
        answer: "MoonStore is a platform that gives Nigerian and African vendors their own branded online store, where buyers browse, chat, and pay directly — no WhatsApp stress, no marketplace competing for attention.",
    },
    {
        question: "Is MoonStore a registered business?",
        answer: "Yes. MoonStore is registered with the Corporate Affairs Commission under MoonStore Branded Stores Technologies.",
    },

    {
        question: "When will I receive my money?",
        answer: "As soon as a buyer pays through your Paystack link, the payment settles directly to your linked bank account within 24 hours.",
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
        question: "Does MoonStore ask for my BVN or NIN?",
        answer: "No. MoonStore never asks for your BVN, NIN, or any sensitive personal ID. We only collect your bank account number and bank name to set up payouts, the same details Paystack itself verifies to confirm your account.",
    },

   {
        question: "Is my business information kept private?",
        answer: "Yes. MoonStore never sells or shares your account details, sales data, or buyer information with third parties. As the platform, MoonStore can see this data to run your dashboard and process payments, but it stays internal and is never exposed publicly beyond what you choose to show on your storefront.",
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