import StoreSettings from "../sellerComponent/StoreSettings";
import ChangePassword from "../sellerComponent/ChangePassword";
import styles from "./SettingsPage.module.css";

function SettingsPage() {
    return(
        <div className={styles.container}>
            <StoreSettings />
        </div>
    );
}

export default SettingsPage;