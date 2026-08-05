import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateStoreSettings, deleteSellerAccount } from "../api/api";
import ChangePassword from "../sellerComponent/ChangePassword";
import styles from "./StoreSettings.module.css";

const StoreSettings = () => {
  const { seller, logout, updateSeller } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [activeSection, setActiveSection] = useState(null);

  // Store settings fields
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Bank details fields
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankLoading, setBankLoading] = useState(false);

  // Delete account
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    if (!seller) return;
    setBusinessName(seller.businessName || "");
    setTagline(seller.tagline || "");
    setWhatsappNumber(seller.whatsappNumber || "");
    setAddress(seller.address || "");
    setPhoneNumber(seller.phoneNumber || "");
    setAccountName(seller.bankDetails?.accountName || "");
    setAccountNumber(seller.bankDetails?.accountNumber || "");
    setBankName(seller.bankDetails?.bankName || "");
  }, [seller]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const goBack = () => {
    setActiveSection(null);
    clearMessages();
  };

  const handleSave = async () => {
    clearMessages();
    setLoading(true);

    const formData = new FormData();
    formData.append("businessName", businessName);
    formData.append("tagline", tagline);
    formData.append("whatsappNumber", whatsappNumber);
    formData.append("address", address);
    formData.append("phoneNumber", phoneNumber);

    if (logo) formData.append("logo", logo);
    if (banner) formData.append("bannerImage", banner);

    const data = await updateStoreSettings(formData);
    setLoading(false);

    if (data?.error) {
      setError(data.error);
      return;
    }

    updateSeller(data.seller);
    setSuccess("Store settings updated successfully.");
    timerRef.current = setTimeout(() => {
      setSuccess(null);
      goBack();
    }, 1500);
  };

  const handleSaveBankDetails = async () => {
    clearMessages();

    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      setError("Please fill in all bank details before saving.");
      timerRef.current = setTimeout(() => setError(null), 2000);
      return;
    }

    setBankLoading(true);

    const formData = new FormData();
    formData.append("accountName", accountName);
    formData.append("accountNumber", accountNumber);
    formData.append("bankName", bankName);

    const data = await updateStoreSettings(formData);
    setBankLoading(false);

    if (data?.error) {
      setError(data.error);
      timerRef.current = setTimeout(() => setError(null), 2000);
      return;
    }

    updateSeller(data.seller);
    setSuccess("Bank details saved successfully.");
    timerRef.current = setTimeout(() => {
      setSuccess(null);
      goBack();
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    if (reason.trim().length < 10) {
      setReasonError("Please provide a reason (at least 10 characters).");
      return;
    }
    setReasonError("");
    setDeleteLoading(true);
    const data = await deleteSellerAccount(reason.trim());
    setDeleteLoading(false);

    if (data?.error) {
      setError(data.error);
      return;
    }

    logout();
    navigate("/login");
  };

  const handleHelpButton = () => {
    const message = `Hi, I need help with my MoonStore store. Business: ${seller?.businessName}`;
    window.open(`https://wa.me/2348152905325?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleWhatsappChannelButton = () => {
    window.open("https://whatsapp.com/channel/0029Vb84tO9GpLHI1O3xll2o", "_blank", "noopener,noreferrer");
  };

  // Main Menu View
  if (!activeSection) {
    return (
      <div className={styles.container}>
        <div className={styles.menu}>
          <div className={styles.menuItem} onClick={() => setActiveSection("store")}>
            <div className={styles.menuLeft}>
              <span className={styles.menuIcon}>🏪</span>
              <div>
                <p className={styles.menuTitle}>Store Settings</p>
                <p className={styles.menuSub}>Name, logo, banner, address</p>
              </div>
            </div>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={styles.menuItem} onClick={() => setActiveSection("password")}>
            <div className={styles.menuLeft}>
              <span className={styles.menuIcon}>🔒</span>
              <div>
                <p className={styles.menuTitle}>Change Password</p>
                <p className={styles.menuSub}>Update your login password</p>
              </div>
            </div>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={styles.menuItem} onClick={() => setActiveSection("payout")}>
            <div className={styles.menuLeft}>
              <span className={styles.menuIcon}>🏦</span>
              <div>
                <p className={styles.menuTitle}>Referral Payout Account</p>
                <p className={styles.menuSub}>Where we send your commissions</p>
              </div>
            </div>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={styles.menuItem} onClick={handleWhatsappChannelButton}>
            <div className={styles.menuLeft}>
              <span className={styles.menuIcon}>📢</span>
              <div>
                <p className={styles.menuTitle}>Join our Channel</p>
                <p className={styles.menuSub}>MoonStore updates, selling tips & motivation on WhatsApp</p>
              </div>
            </div>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={styles.menuItem} onClick={handleHelpButton}>
            <div className={styles.menuLeft}>
              <span className={styles.menuIcon}>💬</span>
              <div>
                <p className={styles.menuTitle}>Need Help?</p>
                <p className={styles.menuSub}>Chat with us on WhatsApp</p>
              </div>
            </div>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={`${styles.menuItem} ${styles.danger}`} onClick={() => setActiveSection("delete")}>
            <div className={styles.menuLeft}>
              <span className={styles.menuIcon}>🗑️</span>
              <div>
                <p className={`${styles.menuTitle} ${styles.dangerText}`}>Delete Account</p>
                <p className={styles.menuSub}>Permanently remove your store</p>
              </div>
            </div>
            <span className={styles.chevron}>›</span>
          </div>
        </div>
      </div>
    );
  }

  // Store Settings Section
  if (activeSection === "store") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>Store Settings</h2>
        </div>

        {success && <p className={styles.success}>{success}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Business Name</label>
            <input className={styles.input} type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Enter your business name" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tagline</label>
            <input className={styles.input} type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g Your best fashion store" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>WhatsApp Number</label>
            <input className={styles.input} type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="e.g 2348054867583" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Physical Address</label>
            <input className={styles.input} type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g 12 Broad Street, Ikeja Lagos" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Phone Number</label>
            <input className={styles.input} type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g +2349034596843" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Logo</label>
            <input className={styles.input} type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Banner Image</label>
            <input className={styles.input} type="file" accept="image/*" onChange={(e) => setBanner(e.target.files[0])} />
          </div>

          <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    );
  }

  // Change Password Section
  if (activeSection === "password") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>Change Password</h2>
        </div>
        <ChangePassword />
      </div>
    );
  }

  // Referral Payout Section
  if (activeSection === "payout") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>Referral Payout Account</h2>
        </div>

        <p className={styles.hint}>
          Add your bank details so we can transfer your referral commission directly to your account. Payouts are every Saturday.
        </p>

        {success && <p className={styles.success}>{success}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Account Name</label>
            <input className={styles.input} type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g Zainab Abdullahi" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Account Number</label>
            <input className={styles.input} type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g 0123456789" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Bank Name</label>
            <input className={styles.input} type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g GTBank" />
          </div>

          <button className={styles.saveBtn} onClick={handleSaveBankDetails} disabled={bankLoading}>
            {bankLoading ? "Saving..." : "Save Bank Details"}
          </button>
        </div>
      </div>
    );
  }

  // Delete Account Section
  if (activeSection === "delete") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Delete Account</h2>
        </div>

        <div className={styles.warningBox}>
          <p className={styles.warningText}>
            Deleting your account will permanently remove your store, all products, and all categories. This cannot be undone.
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.deleteBtn} onClick={() => setShowDeleteWarning(true)}>
          Delete My Account
        </button>

        {showDeleteWarning && (
          <div className={styles.overlay}>
            <div className={styles.popup}>
              <h3 className={styles.popupTitle}>Are you sure?</h3>
              <p className={styles.popupText}>
                This will permanently delete your store, all your products, and all your categories. This action cannot be undone.
              </p>
              <label className={styles.reasonLabel} htmlFor="deleteReason">
                Please tell us why you're leaving (required)
              </label>

              <textarea
                id="deleteReason"
                className={styles.reasonTextarea}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Your feedback helps us improve..."
                rows={4}
              />
              {reasonError && <p className={styles.error}>{reasonError}</p>}
              <div className={styles.popupButtons}>
                <button className={styles.cancelButton} onClick={() => setShowDeleteWarning(false)}>
                  Cancel
                </button>
                <button className={styles.confirmDeleteButton} onClick={handleDeleteAccount} disabled={deleteLoading}>
                  {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default StoreSettings;