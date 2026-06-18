import Sidebar from "./Sidebar";
import styles from "./DashboardLayout.module.css";
import { useState } from "react";
import Topbar from "./Topbar";

function DashboardLayout({ children, hideTopbar }) {

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
                    {/* Only render the Topbar if hideTopbar is not true */}
                    {!hideTopbar &&<Topbar onOpen={handleOpen}/>}

                    <div className={styles.pageContent}>
                        {children}
                    </div>
            </div>
        </div>
    );
}

export default DashboardLayout;