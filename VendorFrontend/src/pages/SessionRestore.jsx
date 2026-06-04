// This page handles the link inside the buyer reminder email.
// When buyer clicks "View Reply", they land here.
// This page reads the session ID from the URL, saves it to localStorage
// so the buyer's chat history is restored, then redirects them
// to the correct store — no login, no form, instant.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SessionRestore.module.css";

const SessionRestore = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sid = params.get("sid");
        const store = params.get("store");

        if (sid) {
            // restore this session ID in the browser
            // if buyer already has a session ID, we replace it with
            // the one from the email so they see the right conversation
            localStorage.setItem("moonstore_session_id", sid);
        }

         if (store) {
            // redirect to the seller's store where the chat lives
            navigate(`/${store}`, { replace: true });
        } else {
            // fallback if store param is missing
            navigate("/", { replace: true });
        }
    }, [navigate]);

    // shows briefly while the redirect happens
    return (
        <div className={styles.page}>
            <p className={styles.text}>Restoring your conversation...</p>
        </div>
    );
};

export default SessionRestore;