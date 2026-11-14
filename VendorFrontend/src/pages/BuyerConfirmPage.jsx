import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { consumeBuyerLink } from "../api/api";
import { getOrCreateSessionId, saveBuyerEmailLocally } from "../utils/session";
import styles from "./BuyerConfirmPage.module.css";

const BuyerConfirmPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const startedRef = useRef(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const run = async () => {
            const result = await consumeBuyerLink(token, getOrCreateSessionId());

            if (result.error) {
                setError(result.error);
                return;
            }

            saveBuyerEmailLocally(result.email);
            localStorage.setItem("moonstore_session_ids", JSON.stringify(result.sessionIds));

            // for an order confirmation, this browser takes over the order's own session so the chat opens
            if (result.restoreSessionId) {
                localStorage.setItem("moonstore_session_id", result.restoreSessionId);
            }

            if (result.conversation) {
                navigate(`/${result.conversation.slug}/chat/${result.conversation.id}`, { replace: true });
            } else {
                navigate("/my-orders", { replace: true });
            }
        };

        run();
    }, [token, navigate]);

    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <p className={styles.error}>{error}</p>
                    <button className={styles.btn} onClick={() => navigate("/")}>
                        Back to home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <p className={styles.text}>Confirming your link...</p>
            </div>
        </div>
    );
};

export default BuyerConfirmPage;