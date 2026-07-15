import { useState, useEffect } from "react";
import styles from "./DesktopBlock.module.css";

const DesktopBlock = ({ children }) => {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const check = () => {
            setIsDesktop(window.innerWidth >= 500);
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    if (isDesktop) {
        return (
            <div className={styles.block}>
                <div className={styles.card}>
                    <h1 className={styles.logo}>MoonStore</h1>
                    <p className={styles.title}>Mobile Only</p>
                    <p className={styles.message}>
                        MoonStore is currently only available on mobile devices.
                        Please open this website on your phone to continue.
                    </p>
                    <div className={styles.icon}>📱</div>
                </div>
            </div>
        );
    }

    return children;
};

export default DesktopBlock;