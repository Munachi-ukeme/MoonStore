import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateStoreSettings, deleteSellerAccount, initializePayment } from "../api/api";
import ChangePassword from "../sellerComponent/ChangePassword";
import styles from "./StoreSettings.module.css";


const plans = [
  {
    key: "basic",
    name: "Basic",
    price: "₦15,000/mo",
    features: [
        "Your own branded online storefront",
        "Shareable store link",
        "Shareable product links",
        "Custom business logo and banner",
        "Add up to 25 products",
        "Add up to 3 categories" ,
        "1 image per product",
        "Built-in chat and ordering system",
        "In-store secure payments",
        "Basic sales insights",
        "Delivery order details",
        "Search Engine Optimisation (SEO), get found on Google",
        "Sales Video Generator — 5 videos/month",
        "Referral programme — earn when you refer other sellers",
        "Direct WhatsApp developer support",      
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "₦35,000/mo",
    features: [
        "Everything in Basic",
        "Add up to 60 products",
        "Add up to 6 categories",
        "Up to 2 images per product",
        "Facebook Pixel & Google Analytics integrations",
        "Built-in email marketing campaigns",
        "Advanced email campaign reporting",
        "Sales Video Generator — 20 videos/month",
        "Limited-time flash sale features",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: "₦75,000/mo",
    features: [
     "Everything in Pro",
     "Unlimited products",
     "Unlimited categories",
     "Up to 3 images per product",
     "Advanced sales & customer traffic insights",
     "End-to-end order management system",
     "Sales Video Generator — 100 videos/month",
     "Priority support",
    ],
  },
];

const StoreSettings = () => {
  const { seller, logout, updateSeller } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(null);

  // store settings fields
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

  // bank details fields
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankLoading, setBankLoading] = useState(false);

  // delete account
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // plan selection
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

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
    setTimeout(() => {
      setSuccess(null);
      goBack();
    }, 1500);
  };

  const handleSaveBankDetails = async () => {
    clearMessages();

    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      setError("Please fill in all bank details before saving.");
      setTimeout(() => setError(null), 2000);
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
      setTimeout(() => setError(null), 2000);
      return;
    }

     updateSeller(data.seller);
    setSuccess("Bank details saved successfully.");
    setTimeout(() => {
      setSuccess(null);
      goBack();
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const data = await deleteSellerAccount();
    setDeleteLoading(false);

    if (data?.error) {
      setError(data.error);
      return;
    }

    logout();
    navigate("/login");
  };

  const handleHelpButton = () => {
    const message = `Hi, I need help with my MoonStore store. Business: ${seller?.businessName} Plan: ${seller?.plan}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/2348152905325?text=${encodedMessage}`, "_blank");
  };

  const handlePay = async () => {
    if (!selectedPlan) return;
    setPayLoading(true);
    setError(null);
    const data = await initializePayment(selectedPlan);
    setPayLoading(false);
    if (data?.error) {
      setError(data.error);
      return;
    }
    window.location.href = data.paymentUrl;
  };

  const isPro = seller?.plan === "pro";
  const isPremium = seller?.plan === "premium";
  const isActive = seller?.isActive;
  const isReactivating = !!seller?.subscriptionEnd;

  // menu list
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

          {!isPremium && isActive ? (
            <div className={styles.menuItem} onClick={() => setActiveSection("upgrade")}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon}>⭐</span>
                <div>
                  <p className={styles.menuTitle}>Upgrade Plan</p>
                  <p className={styles.menuSub}>Get more products and features</p>
                </div>
              </div>
              <span className={styles.chevron}>›</span>
            </div>
          ) : null}

          {!isActive ? (
            <div className={styles.menuItem} onClick={() => setActiveSection("activate")}>
              <div className={styles.menuLeft}>
                <span className={styles.menuIcon}>🚀</span>
                <div>
                  <p className={styles.menuTitle}>
                    {isReactivating ? "Reactivate Store" : "Activate Store"}
                  </p>
                  <p className={styles.menuSub}>Choose a plan and go live</p>
                </div>
              </div>
              <span className={styles.chevron}>›</span>
            </div>
          ) : null}

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

  // store settings section
  if (activeSection === "store") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>Store Settings</h2>
        </div>

        {success ? <p className={styles.success}>{success}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

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

          {seller?.plan === "pro" || seller?.plan === "premium" ? (
            <div className={styles.field}>
              <label className={styles.label}>Banner Image</label>
              <input className={styles.input} type="file" accept="image/*" onChange={(e) => setBanner(e.target.files[0])} />
            </div>
          ) : null}


          <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    );
  }

  // change password section
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

  // referral payout section
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

        {success ? <p className={styles.success}>{success}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

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

  // upgrade plan section
  if (activeSection === "upgrade") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>Upgrade Plan</h2>
        </div>

        <div className={styles.feeNotice}>
          <p className={styles.feeTitle}>1.5% platform service fee per order processed</p>
          <p className={styles.feeBody}>
            Every payment your buyer makes goes through MoonStore's secure payment infrastructure — collected, split automatically and settled to your bank account daily. The 1.5% is what keeps that infrastructure running for you.
          </p>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.plans}>
          {plans.map((plan) => {
            const isCurrent = seller?.plan === plan.key;
            return (
              <div
                key={plan.key}
                className={`${styles.planCard} ${selectedPlan === plan.key ? styles.selectedPlan : ""} ${isCurrent ? styles.disabledPlan : ""}`}
                onClick={() => { if (!isCurrent) setSelectedPlan(plan.key); }}
              >
                <div className={styles.planTop}>
                  <div>
                    <span className={styles.planName}>{plan.name}</span>
                    {isCurrent ? <span className={styles.currentBadge}>Current</span> : null}
                  </div>
                  <span className={styles.planPrice}>{plan.price}</span>
                </div>
                <ul className={styles.featureList}>
                  {plan.features.map((f) => (
                    <li key={f} className={styles.featureItem}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <button className={styles.payBtn} onClick={handlePay} disabled={!selectedPlan || payLoading}>
          {payLoading ? "Redirecting to Paystack..." : "Proceed to Payment"}
        </button>
      </div>
    );
  }

  // activate / reactivate section
  if (activeSection === "activate") {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <h2 className={styles.sectionTitle}>
            {isReactivating ? "Reactivate Store" : "Activate Store"}
          </h2>
        </div>

        <p className={styles.hint}>
          {isReactivating
            ? "Your subscription has ended. Pick a plan to go live again."
            : "Choose a plan to activate your store and start selling."}
        </p>

        <div className={styles.feeNotice}>
          <p className={styles.feeTitle}>1.5% platform service fee per order processed</p>
          <p className={styles.feeBody}>
            Every payment your buyer makes goes through MoonStore's secure payment infrastructure — collected, split automatically and settled to your bank account daily. The 1.5% is what keeps that infrastructure running for you.
          </p>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.plans}>
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`${styles.planCard} ${selectedPlan === plan.key ? styles.selectedPlan : ""}`}
              onClick={() => setSelectedPlan(plan.key)}
            >
              <div className={styles.planTop}>
                <span className={styles.planName}>{plan.name}</span>
                <span className={styles.planPrice}>{plan.price}</span>
              </div>
              <ul className={styles.featureList}>
                {plan.features.map((f) => (
                  <li key={f} className={styles.featureItem}>✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button className={styles.payBtn} onClick={handlePay} disabled={!selectedPlan || payLoading}>
          {payLoading ? "Redirecting to Paystack..." : "Proceed to Payment"}
        </button>
      </div>
    );
  }

  // delete account section
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

        {error ? <p className={styles.error}>{error}</p> : null}

        <button className={styles.deleteBtn} onClick={() => setShowDeleteWarning(true)}>
          Delete My Account
        </button>

        {showDeleteWarning ? (
          <div className={styles.overlay}>
            <div className={styles.popup}>
              <h3 className={styles.popupTitle}>Are you sure?</h3>
              <p className={styles.popupText}>
                This will permanently delete your store, all your products, and all your categories. This action cannot be undone.
              </p>
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
        ) : null}
      </div>
    );
  }
};

export default StoreSettings;