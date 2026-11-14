import { useState } from "react";
import { sellerCancelOrder } from "../api/api";
import styles from "./CancelOrderModal.module.css";

const REASONS = [
    { value: "out_of_stock", label: "Out of stock" },
    { value: "cannot_deliver_there", label: "Cannot deliver to that location" },
    { value: "wrong_price", label: "Wrong price on the listing" },
    { value: "buyer_asked", label: "The buyer asked me to cancel" },
    { value: "other", label: "Other" },
];

const CancelOrderModal = ({ conversationId, onClose, onDone }) => {
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCancel = async () => {
        setError("");

        if (!reason) {
            setError("Please choose a reason");
            return;
        }

        if (reason === "other" && !note.trim()) {
            setError("Please add a short note");
            return;
        }

        setLoading(true);
        const result = await sellerCancelOrder(conversationId, reason, note.trim());
        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        onDone();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3 className={styles.title}>Cancel this order?</h3>
                <p className={styles.text}>
                    The buyer will be fully refunded (the escrow service fee cannot be returned). This is recorded on your store.
                </p>

                <div className={styles.reasons}>
                    {REASONS.map((item) => (
                        <label key={item.value} className={styles.reasonRow}>
                            <input
                                type="radio"
                                name="cancelReason"
                                value={item.value}
                                checked={reason === item.value}
                                onChange={() => setReason(item.value)}
                            />
                            <span>{item.label}</span>
                        </label>
                    ))}
                </div>

                <textarea
                    className={styles.note}
                    placeholder="Add a short note (required for Other)"
                    value={note}
                    maxLength={300}
                    onChange={(e) => setNote(e.target.value)}
                />

                {error ? <p className={styles.error}>{error}</p> : null}

                <div className={styles.actions}>
                    <button className={styles.keepBtn} onClick={onClose} disabled={loading}>
                        Keep order
                    </button>
                    <button className={styles.cancelBtn} onClick={handleCancel} disabled={loading}>
                        {loading ? "Cancelling..." : "Cancel order"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelOrderModal;