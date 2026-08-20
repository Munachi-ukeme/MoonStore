import { useState, useEffect } from "react";
import styles from "./InstallAppButton.module.css";

const InstallAppButton = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iPhone/iPad — Safari never fires the install event below
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
            setIsIOS(true);
        }

        // Detect if already running as an installed app
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
        }

        // The browser fires this event when it decides the site can be installed.
        // We catch it and save it, so we can trigger it later on our own button click.
        const handlePromptReady = (event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };

        window.addEventListener("beforeinstallprompt", handlePromptReady);
        return () => window.removeEventListener("beforeinstallprompt", handlePromptReady);
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === "accepted") {
            setIsInstalled(true);
        }
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