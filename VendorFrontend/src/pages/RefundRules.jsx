import { Link } from "react-router-dom";
import styles from "./RefundRules.module.css";

const SECTIONS = [
    {
        "t": "1. How your payment is protected",
        "p": [
            "When you pay for an order, MoonStore does not hand the money to the seller straight away. It is held safely by our escrow partner, EscrowPay, until your order is delivered.",
            "The seller is paid only after delivery is confirmed (see section 3). If something goes wrong, the money is still there to protect you."
        ]
    },
    {
        "t": "2. The seller must ship within 48 hours",
        "p": [
            "After you pay, the seller has 48 hours to mark your order as shipped.",
            "If the seller does not ship in time, you are refunded automatically. The escrow service fee is not refunded (see section 8)."
        ]
    },
    {
        "t": "3. Confirming delivery",
        "p": [
            "When the seller ships, you get an email and an SMS. Your 4-digit parcel code appears in your chat.",
            "Only after the parcel is in your hands, type the code in the chat to confirm delivery. Never give the code to anyone before you are holding your parcel.",
            "If you do nothing, the order is released to the seller automatically once the delivery time plus 48 hours has passed. You get a reminder before this happens, and you can raise a problem any time before then."
        ]
    },
    {
        "t": "4. Cancelling an order",
        "p": [
            "Buyers cannot cancel a paid order. This keeps sellers safe from last-minute cancellations.",
            "A seller may cancel before shipping, with a written reason. You then get a full refund of the amount you paid for the order.",
            "Once an order is marked shipped, it cannot be cancelled."
        ]
    },
    {
        "t": "5. Raising a problem (dispute)",
        "p": [
            "You can raise a problem only after the order is marked shipped and before the money is released. Sellers can also raise a problem, for example if the buyer cannot be reached or refuses the parcel.",
            "Buyer reasons: item not received, wrong item, damaged item, not as described, other. Seller reasons: buyer unreachable, buyer refused the parcel, wrong address, other.",
            "For “not received” you answer three short questions. Add clear photos as evidence. Photos only, no videos for now.",
            "The MoonStore team reads both sides and decides by hand. We may release the money to the seller, refund the buyer, or split it fairly. We tell both of you the result."
        ]
    },
    {
        "t": "6. Returns and refunds",
        "p": [
            "Wrong item, damaged, or not as described: if the seller is at fault you get a refund. The money stays held while the seller sends a dispatch to collect the item, which must happen within 48 hours.",
            "Change of mind, wrong size or colour you chose: this is not the seller’s fault, so the buyer is on their own.",
            "Every order is refundable when the seller is at fault. The seller must arrange a dispatch to collect the item within 48 hours. If the seller does not, the buyer is refunded even if the item is never sent back.",
        ]
    },
    {
        "t": "7. Who pays for sending an item back",
        "p": [
            "The person at fault pays. If the seller is at fault, the seller covers it. If the buyer is at fault, for example refused or unreachable at delivery, the buyer covers it.",
            "If a courier asks for an extra fee to bring a refused parcel back, it is deducted from the product price that was paid."
        ]
    },
    {
        "t": "8. Fees",
        "p": [
            "The escrow service fee is paid by the buyer at checkout and is never refunded, whatever the outcome.",
            "MoonStore’s commission is taken from the seller’s product price only, never from delivery."
        ]
    },
    {
        "t": "9. Keep everything inside MoonStore",
        "p": [
            "Links, bank details and phone-number tricks are blocked in chat. Pay only through the payment details MoonStore generates in your chat.",
            "MoonStore will never ask for your PIN, card details or code. If anyone does, report it in the chat."
        ]
    },
    {
        "t": "10. Repeated problems",
        "p": [
            "Sellers or buyers who lose several disputes get a warning, then limits on their account, and in serious cases a permanent block. Fraud leads to immediate action."
        ]
    },
    {
        "t": "11. Need help?",
        "p": [
            "Use the report button in your chat, or message support on WhatsApp: +2349126664419."
        ]
    }
];

const RefundRules = () => {
    return (
        <div className={styles.page}>
            <Link to="/" className={styles.back}>← Back to MoonStore</Link>
            <h1 className={styles.title}>Refund &amp; Dispute Rules</h1>
            <p className={styles.updated}>Last updated 12 November 2026</p>

            {SECTIONS.map((section) => (
                <div key={section.t} className={styles.section}>
                    <h2 className={styles.heading}>{section.t}</h2>
                    {section.p.map((text) => (
                        <p key={text} className={styles.text}>{text}</p>
                    ))}
                </div>
            ))}

            <p className={styles.footer}>
                Need help? WhatsApp +2348152905325
            </p>
        </div>
    );
};

export default RefundRules;
