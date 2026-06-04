// This header sits at the top of every buyer chat thread.
// Built now as a standalone component — dropped into the
// chat page when chat is built in Phase 4.

import { useNavigate } from "react-router-dom";
import styles from "./ChatNavHeader.module.css";

const ChatNavHeader = ({ storeSlug, storeName }) => {
    const navigate = useNavigate();

    return (
        <div className={styles.header}>
            <button
                className={styles.link}
                onClick={() => navigate("/my-orders")}
            >
                ← My Orders
            </button>
            <button
                className={styles.link}
                onClick={() => navigate(`/${storeSlug}`)}
            >
                Visit Store →
            </button>
        </div>
    );
};

export default ChatNavHeader;