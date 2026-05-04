import Sidebar from "./Sidebar";
import styles from "./DashboardLayout.module.css";
import { useState } from "react";
import Topbar from "./Topbar";

function DashboardLayout({ children }) {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleOpen =()=>{
        setSidebarOpen(true);
    };

    const handleClose = ()=>{
        setSidebarOpen(false)
    };

    return(
        <div className={styles.layout}>
            <Sidebar isOpen={sidebarOpen} onClose={handleClose}/>
            <div className={styles.main}>
                
                    {/* topbar sits above all pafe content */}
                    <Topbar onOpen={handleOpen}/>
                {children}
            </div>
        </div>
    );
}

export default DashboardLayout;