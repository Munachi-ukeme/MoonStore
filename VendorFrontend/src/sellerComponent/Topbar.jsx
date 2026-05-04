import {useLocation} from "react-router-dom"; //this makes it possible for topbar to display the right page a user is on.

import { useAuth } from "../context/AuthContext";
import styles from "./Topbar.module.css";

function Topbar ({ onOpen}){
    const {seller} = useAuth();
    const location = useLocation();

    // check current url and return the right page title
    let pageTitle;
    if(location.pathname ==="/dashboard"){
        pageTitle = "Dashboard";
    } else if(location.pathname === "/dashboard/products"){
        pageTitle = "Products";
    } else if(location.pathname === "/dashboard/category") {
        pageTitle = "Categories"
    } else if(location.pathname === "/dashboard/settings"){
        pageTitle = "Settings"
    } else{
        pageTitle = "Dashboard"
    }

    // check plan and return the right badge color class
    let planClass;
    if (seller?.plan === "basic"){
        planClass = styles.planBasic;
    } else if(seller?.plan === "pro"){
        planClass = styles.planPro;
    } else if (seller?.plan === 'premium') {
        planClass = styles.planPremium;
    } else{
        planClass = styles.planBasic;
    }

    return(

        <div className={styles.topbar}>
           {/* hamburger menu button-only show on mobile */}
                <button className={styles.menuButton} onClick={onOpen}>
                     ☰
                    </button>
                    
            <h2 className={styles.pageTitle}>{pageTitle}</h2>

            {/* seller plan badge */}
            <div className={`${styles.planBadge} ${planClass}`}>{seller?.plan}</div>
        </div>
    );
}

export default Topbar;