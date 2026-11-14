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

        const sidIsValid = typeof sid === "string" && /^[A-Za-z0-9-]{10,100}$/.test(sid);
        const storeIsValid = typeof store === "string" && /^[a-z0-9-]{1,80}$/.test(store);

        if (sidIsValid) {
            localStorage.setItem("moonstore_session_id", sid);
        }

        if (storeIsValid) {
            navigate(`/${store}`, { replace: true });
        } else {
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