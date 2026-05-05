import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {updateStoreSettings, deleteSellerAccount} from "../api/api";

import styles from "./StoreSettings.module.css";


function StoreSettings() {
    const { seller, logout} = useAuth();
    const navigate = useNavigate();

    const [businessName, setBusinessName] = useState("");

    const [tagline, setTagline] = useState("");

    const [whatsappNumber, setWhatsappNumber] = useState("");

    const [address, setAddress] = useState("");

    const [primaryColor, setPrimaryColor] = useState("");

    const [secondaryColor, setSecondaryColor] = useState("");

    const [logo, setLogo] = useState(null);

    const [banner, setBanner] = useState(null);

    const [loading, setLoading] = useState(false)

    const [error, setError] = useState(null)

    const [success, setSuccess] = useState(null);

    const [showDeleteWarning, setShowDeleteWarning] = useState(false);

    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() =>{
        if(!seller) return;

        setBusinessName(seller.businessName || "");
        setTagline(seller.tagline || "");
        setWhatsappNumber(seller.whatsappNumber || "");
        setAddress(seller.address || "");
        setPrimaryColor(seller.primaryColor || "");
        setSecondaryColor(seller.secondaryColor || "");
    }, [seller]);

    const handleSave = async()=>{
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("businessName", businessName);
    formData.append("tagline", tagline);
    formData.append("whatsappNumber", whatsappNumber);
    formData.append("address", address);

    if (seller?.plan === "pro" || seller?.plan === "premium") {
        formData.append("primaryColor", primaryColor);
        formData.append("secondaryColor", secondaryColor);
    }

    if (logo) {
        formData.append("logo", logo);
    }

    if (banner && (seller?.plan === "pro" || seller?.plan === "premium")) {
        formData.append("bannerImage", banner);
    }

    const data = await updateStoreSettings(formData);
    setLoading(false);

    if (data?.error) {
        setError(data.error);
        return;
    }

    setSuccess("Store settings updated successfully.");
};

const handleDeleteAccount = async ()=>{
    setDeleteLoading(true);
    const data = await deleteSellerAccount();
    setDeleteLoading(false);

    if (data?.error) {
        setError(data.error)
        return;
    }

    logout();
    navigate("/login");
};

const handleHelpButton = () =>{
    const message = `Hi, I need help with my MoonStore store. Business: ${seller?.businessName}
    Plan: ${seller?.plan}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/2348152905325?text=${encodedMessage}`, "_blank");
};


return(
<div className={styles.container}>
    <h2 className={styles.title}>Store Settings</h2>

    {/* success message */}
    {success && <p className={styles.success}>{success}</p>}

    {/* error message */}
    {error && <p className={styles.error}>{error}</p>}

    {/* business name */}
    <div className={styles.field}>
        <label className={styles.label}>Business Name</label>
        <input
        type="text"
        className={styles.input}
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Enter your business name"
        />
    </div>

    <div className={styles.field}>
        <label className={styles.label}>Tagline</label>
        <input
        type="text"
        className={styles.input}
        onChange={(e) =>setTagline(e.target.value)}
        value={tagline}
        placeholder="e.g Your best fashion store"
        />
    </div>

    {/* whatsapp number */}
    <div className={styles.field}>
        <label className={styles.label}>WhatsApp Number</label>
        <input
        type="text"
        className={styles.input}
        onChange={(e) =>setWhatsappNumber(e.target.value)}
        value={whatsappNumber}
        placeholder="e.g 2348054867583"
        />
    </div>

    {/* physical addresss */}
    <div className={styles.field}>
        <label className={styles.label}>Physical Address</label>
        <input
        type="text"
        className={styles.input}
        onChange={(e) =>setAddress(e.target.value)}
        value={address}
        placeholder="e.g 12 Broad Street, Ikeja Lagos"
        />
    </div>

    <div className={styles.field}>
        <label className={styles.label}>Logo</label>
        <input
        type="file"
        className={styles.input}
        accept="image/*"
        onChange={(e) =>setLogo(e.target.files[0])}       
        />
    </div>

    {/* banner image - pro and premium only */}
    {seller?.plan === "pro" || seller?.plan === "premium" ? (
        <div className={styles.field}>
            <label className={styles.label}>Banner Image</label>
            <input
            type="file"
            className={styles.input}
            accept="image/*"
            onChange={(e) => setBanner(e.target.files[0])}
            />
        </div>
    ) : null}

    {/* brand colors - pro and premium only */}
    {seller?.plan === "pro" || seller?.plan === "premium" ? (
        <div className={styles.colors}>
            <div className={styles.field}>
                <label className={styles.label}>Primary Color</label>
                <input
                type="color"
                className={styles.colorInput}
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Secondary Color</label>
                <input
                type="color"
                className={styles.colorInput}
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                />
            </div>

        </div>
    ) : null}

    {/* save button */}
    <button
    className={styles.saveButton}
    onClick={handleSave}
    disabled={loading}
    >
        {loading ? "Saving..." : "Save Settings"}
    </button>

    {/* help button */}
    <div className={styles.helpSection}>
        <p className={styles.helpText}>Need help with your store?</p>
        <button className={styles.helpButton} onClick={handleHelpButton}>Chat With Us on WhatsApp</button>
    </div>

    {/* delete account section */}
    <div className={styles.dangerSection}>
        <h3 className={styles.dangerTitle}>Danger Zone</h3>
        <p className={styles.dangerText}>Deleting your account will permanently remove your store, all products and all categories. This cannot be undone.</p>

        <button
        className={styles.deleteButton}
        onClick={() => setShowDeleteWarning(true)}
        >
            Delete Account
        </button>
    </div>

    {/* delete warning popup */}
    {showDeleteWarning ? (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <h3 className={styles.popupTitle}>Are you sure?</h3>
                <p className={styles.popupText}>This will permanently delete your store, all your products, and all your categories. This action cannot be undone.</p>

                <div className={styles.popupButtons}>
                    <button
                    className={styles.cancelButton}
                    onClick={() => setShowDeleteWarning(false)}
                    >
                        Cancel
                    </button>

                    <button
                    className={styles.confirmDeleteButton}
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    >
                        {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
                    </button>
                </div>
            </div>
        </div>
    ) : null}

</div>
);
}

export default StoreSettings;