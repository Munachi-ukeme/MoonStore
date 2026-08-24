import { useState, useEffect } from "react";
import { getInstallPrompt, clearInstallPrompt } from "../utils/installPrompt";
import styles from "./InstallAppButton.module.css";

const InstallAppButton = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
            setIsIOS(true);
        }

        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
        }

        // Check the shared box — was the event already caught back when
        // App.jsx first loaded, even before this button ever mounted?
        setInstallPrompt(getInstallPrompt());
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === "accepted") {
            setIsInstalled(true);
        }
        clearInstallPrompt();
        setInstallPrompt(null);
    };

    if (isInstalled) {
        return <p className={styles.statusText}>✓ App already installed</p>;
    }

    if (isIOS) {
        return (
            <div className={styles.iosBox}>
                <p className={styles.iosText}>
                    To install: tap the Share button in Safari, then choose
                    "Add to Home Screen."
                </p>
            </div>
        );
    }

    if (!installPrompt) {
        return <p className={styles.statusText}>Installing isn't available on this browser yet.</p>;
    }

    return (
        <button className={styles.installBtn} onClick={handleInstallClick}>
            Install MoonStore App
        </button>
    );
};

export default InstallAppButton;