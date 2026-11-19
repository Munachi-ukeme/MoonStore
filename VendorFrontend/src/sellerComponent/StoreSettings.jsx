import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateStoreSettings, deleteSellerAccount, updateDeliveryOptions, retryPayoutSetup, getBanks, verifyAccount, changeBankAccount } from "../api/api";
import ChangePassword from "../sellerComponent/ChangePassword";
import styles from "./StoreSettings.module.css";
import InstallAppButton from "../sellerComponent/InstallAppButton";

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
  const [payoutMessage, setPayoutMessage] = useState("");
    // Change bank account
  const [banks, setBanks] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
    // Delivery options
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

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
    setDeliveryZones(
      (seller.deliveryOptions || []).map((zone) => ({
        label: zone.label,
        price: String(zone.price),
        estimatedDays: String(zone.estimatedDays),
      }))
    );
  }, [seller]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

    useEffect(() => {
    if (activeSection !== "bank" || banks.length > 0) return;

    const loadBanks = async () => {
      setBankLoading(true);
      const result = await getBanks();
      if (!result.error && result.banks) {
        setBanks(
          result.banks.filter(
            (bank, index, self) => self.findIndex((b) => b.code === bank.code) === index
          )
        );
      }
      setBankLoading(false);
    };

    loadBanks();
  }, [activeSection]);

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      const resolve = async () => {
        setResolving(true);
        setResolvedName("");
        const result = await verifyAccount(accountNumber, bankCode);
        if (result.error) {
          setError("Account not found. Check the number and selected bank.");
        } else {
          setError(null);
          setResolvedName(result.accountName);
        }
        setResolving(false);
      };
      resolve();
    } else {
      setResolvedName("");
    }
  }, [accountNumber, bankCode]);

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

 
    const handleZoneChange = (index, field, value) => {
    setDeliveryZones((prev) =>
      prev.map((zone, i) => (i === index ? { ...zone, [field]: value } : zone))
    );
  };

  const handleAddZone = () => {
    if (deliveryZones.length >= 10) return;
    setDeliveryZones((prev) => [...prev, { label: "", price: "", estimatedDays: "" }]);
  };

  const handleRemoveZone = (index) => {
    setDeliveryZones((prev) => prev.filter((_, i) => i !== index));
  };

 const handleRetryPayout = async () => {
  setPayoutMessage("Finishing your payout setup...");
  const data = await retryPayoutSetup();

  if (data?.error) {
    setPayoutMessage(data.error);
    return;
  }

  setPayoutMessage("Payout setup complete. You can now add products.");
  setTimeout(() => window.location.reload(), 1200);
};

const handleSaveDelivery = async () => {
  clearMessages();

  if (deliveryZones.length === 0) {
    setError("Add at least one delivery option before saving.");
    timerRef.current = setTimeout(() => setError(null), 2500);
    return;
  }

  const hasBlank = deliveryZones.some(
    (zone) => !zone.label.trim() || zone.price === "" || zone.estimatedDays === ""
  );

  if (hasBlank) {
    setError("Fill in every field, or remove the empty delivery option.");
    timerRef.current = setTimeout(() => setError(null), 3000);
    return;
  }

  setDeliveryLoading(true);
  const data = await updateDeliveryOptions(
    deliveryZones.map((zone) => ({
      label: zone.label.trim(),
      price: Number(zone.price),
      estimatedDays: Number(zone.estimatedDays),
    }))
  );
  setDeliveryLoading(false);

  if (data?.error) {
    setError(data.error);
    timerRef.current = setTimeout(() => setError(null), 3000);
    return;
  }

  updateSeller(data.seller);
  setSuccess("Delivery options saved.");
  timerRef.current = setTimeout(() => {
    setSuccess(null);
    goBack();
  }, 1500);
};

  const handleBankSelect = (e) => {
    const selected = banks.find((b) => b.code === e.target.value);
    setBankCode(selected ? selected.code : "");
    setBankName(selected ? selected.name : "");
  };

  const handleSaveBank = async () => {
    clearMessages();

    if (!bankCode) {
      setError("Please select a bank.");
      return;
    }

    if (accountNumber.length !== 10) {
      setError("Enter a valid 10-digit account number.");
      return;
    }

    if (!resolvedName) {
      setError("Account name could not be resolved. Check your details.");
      return;
    }

    setBankSaving(true);
    const data = await changeBankAccount(accountNumber, bankCode, bankName);
    setBankSaving(false);

    if (data?.error) {
      setError(data.error);
      return;
    }

    updateSeller(data.seller);
    setSuccess("Payout setup complete. You can now add products.");
    timerRef.current = setTimeout(() => window.location.reload(), 1500);
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
    window.open(`https://wa.me/2349126664419?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleWhatsappChannelButton = () => {
    window.open("https://whatsapp.com/channel/0029Vb9UqZxIHphB9e1PQa0g", "_blank", "noopener,noreferrer");
  };

  // Main Menu View
  if (!activeSection) {
    return (
      <div className={styles.container}>
        <div className={styles.menu}>
                    {payoutMessage ? <p className={styles.hint}>{payoutMessage}</p> : null}

          {seller?.onboardingStatus === "pending" ? (
            <div className={styles.menuItem} onClick={handleRetryPayout}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon}>🏦</span>
                <div>
                  <p className={styles.menuTitle}>Finish payout setup</p>
                  <p className={styles.menuSub}>Your store can't take orders until this is done</p>
                </div>
              </div>
              <span className={styles.chevron}>›</span>
            </div>
          ) : null}

            {seller?.onboardingStatus === "pending" ? (
            <div className={styles.menuItem} onClick={() => setActiveSection("bank")}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon}>💳</span>
                <div>
                  <p className={styles.menuTitle}>Change bank account</p>
                  <p className={styles.menuSub}>Use a different account for payouts</p>
                </div>
              </div>
              <span className={styles.chevron}>›</span>
            </div>
          ) : null}
          
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

          <div className={styles.menuItem} onClick={() => setActiveSection("delivery")}>
            <div className={styles.menuLeft}>
              <span className={styles.menuIcon}>🚚</span>
              <div>
                <p className={styles.menuTitle}>Delivery Options</p>
                <p className={styles.menuSub}>Where you deliver, prices and days</p>
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


                    <div className={styles.menuItem} onClick={() => setActiveSection("installApp")}>
            <div className={styles.menuLeft}>
              <span className={styles.menuIcon}>📱</span>
              <div>
                <p className={styles.menuTitle}>Install App</p>
                <p className={styles.menuSub}>Add MoonStore to your home screen</p>
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

    // Delivery Options Section
  if (activeSection === "delivery") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>Delivery Options</h2>
        </div>

        <p className={styles.hint}>
          Add the places you deliver to, like "Within Lagos" or "Outside Lagos". Buyers pick one on your product page and pay that delivery fee once per order. Set a price that covers your real courier cost, because it cannot be changed after the buyer has paid.
        </p>

        {success ? <p className={styles.success}>{success}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.form}>
          {deliveryZones.map((zone, index) => (
            <div key={index} className={styles.zoneCard}>
              <div className={styles.field}>
                <label className={styles.label}>Place</label>
                <input
                  className={styles.input}
                  type="text"
                  value={zone.label}
                  onChange={(e) => handleZoneChange(index, "label", e.target.value)}
                  placeholder="e.g. Within Lagos"
                  maxLength={40}
                />
              </div>

              <div className={styles.zoneRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Price (₦)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    value={zone.price}
                    onChange={(e) => handleZoneChange(index, "price", e.target.value)}
                    placeholder="e.g. 2000"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Days</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    max="60"
                    value={zone.estimatedDays}
                    onChange={(e) => handleZoneChange(index, "estimatedDays", e.target.value)}
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              <button className={styles.removeZoneBtn} onClick={() => handleRemoveZone(index)}>
                Remove
              </button>
            </div>
          ))}

          <button className={styles.addZoneBtn} onClick={handleAddZone}>
            + Add delivery option
          </button>

          <button className={styles.saveBtn} onClick={handleSaveDelivery} disabled={deliveryLoading}>
            {deliveryLoading ? "Saving..." : "Save Delivery Options"}
          </button>
        </div>
      </div>
    );
  }


    // Change Bank Account Section
  if (activeSection === "bank") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>Change Bank Account</h2>
        </div>

        <p className={styles.hint}>
          Double-check this is the correct account. Your sales money will be sent here, and MoonStore cannot recover money sent to the wrong account.
        </p>

        {success ? <p className={styles.success}>{success}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Select Bank</label>
            {bankLoading ? (
              <p className={styles.hint}>Loading banks...</p>
            ) : (
              <select className={styles.input} value={bankCode} onChange={handleBankSelect}>
                <option value="">-- Select your bank --</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Account Number</label>
            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit account number"
            />
            {resolving ? <p className={styles.hint}>Verifying account...</p> : null}
            {resolvedName && !resolving ? <p className={styles.success}>✓ {resolvedName}</p> : null}
          </div>

          <button className={styles.saveBtn} onClick={handleSaveBank} disabled={bankSaving}>
            {bankSaving ? "Setting up..." : "Save and finish payout setup"}
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

    // Install App Section
  if (activeSection === "installApp") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>Install App</h2>
        </div>

        <p className={styles.hint}>
          Install MoonStore on your phone for quick access to your dashboard,
          products, and chats just like a regular app.
        </p>

        <InstallAppButton />
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