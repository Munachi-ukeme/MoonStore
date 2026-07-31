import Sidebar from "./Sidebar";
import styles from "./DashboardLayout.module.css";
import { useState, useEffect } from "react";
import Topbar from "./Topbar";
import TrialBanner from "../sellerComponent/TrialBanner";

const WIDE_BREAKPOINT = 900;

function DashboardLayout({ children, hideTopbar }) {
    const [isWide, setIsWide] = useState(window.innerWidth >= WIDE_BREAKPOINT);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= WIDE_BREAKPOINT);

    useEffect(() => {
        const handleResize = () => {
            const nowWide = window.innerWidth >= WIDE_BREAKPOINT;
            setIsWide(nowWide);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleOpen = () => {
        setSidebarOpen(true);
    };

    const handleClose = () => {
        setSidebarOpen(false);
    };

    const handleToggle = () => {
        setSidebarOpen((prev) => !prev);
    };

    return (
        <div className={styles.layout}>
            <Sidebar isOpen={sidebarOpen} onClose={handleClose} onToggle={handleToggle} isWide={isWide} />
            <div
                className={styles.main}
                style={{ marginLeft: isWide && sidebarOpen ? "210px" : "0" }}
            >
                {!hideTopbar && <Topbar onOpen={handleOpen} onToggle={handleToggle} isWide={isWide} sidebarOpen={sidebarOpen} />}
                <TrialBanner />
                <div className={styles.pageContent}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout;