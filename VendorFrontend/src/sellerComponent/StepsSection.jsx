import styles from "./StepsSection.module.css";

const steps = [
    {
        number: "1",
        title: "Sign up",
        text: "Enter your business name, email, password, WhatsApp number, and the bank account you want your sales money to be sent to, this is very important.",
    },
    {
        number: "2",
        title: "Set up your store",
        text: "Add your logo, banner, tagline, Phone Number, physical address, products, and categories.",
    },
    {
        number: "3",
        title: "Share your store link",
        text: "Put your store link in your social media bios so buyers can find and shop your store.",
    },
    {
        number: "4",
        title: "Link every product you post",
        text: "Paste the product link next to every product you post or share, so customers can order directly inside your store.",
    },
    {
        number: "5",
        title: "Get orders, get paid",
        text: "Buyers order and pay you through chat, powered securely by Paystack.",
    },
];

const StepsSection = () => {
    return (
        <div className={styles.section}>
            <p className={styles.heading}>How to create your store</p>
            <p className={styles.subheading}>Five steps. No tech skills needed.</p>

            <div className={styles.list}>
                {steps.map((step) => (
                    <div key={step.number} className={styles.step}>
                        <div className={styles.numberCircle}>{step.number}</div>
                        <div className={styles.stepText}>
                            <p className={styles.stepTitle}>{step.title}</p>
                            <p className={styles.stepDesc}>{step.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StepsSection;