import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerSeller, getBanks, verifyAccount } from "../api/api";
import styles from "./SignupPage.module.css";

const SignupPage = () =>{
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [banks, setBanks] = useState([]);
    const [banksLoading, setBanksLoading] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [resolvedName, setResolvedName] = useState("");
    const [bankError, setBankError] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [refFromUrl, setRefFromUrl] = useState(false);

    const [formDetails, setFormDetails] = useState({
        businessName: "",
        email: "",
        password: "",
        whatsappNumber: "",
        accountNumber: "",
        bankCode: "",
        bankName: "",
        referredBy: "",
    });

    //auto-fill referral code from URL e.g /signup?ref=482910
    useEffect(() =>{
        const params = new URLSearchParams(window.location.search);
        const ref = params.get("ref");
        if (ref) {
            setFormDetails((prev) =>({ ...prev, referredBy: ref }));
             setRefFromUrl(true); // ← mark it as locked
        }
    }, []);

    // fetch bank list on mount
    useEffect(() => {
        const loadBanks = async () => {
            setBanksLoading(true);
            const result = await getBanks();
            if (!result.error && result.banks) {

                // This  filters out bank duplicates cleanly
                const uniqueBanks = result.banks.filter(
                    (bank, index, self) => self.findIndex(b => b.code === bank.code) === index
                );
                setBanks(uniqueBanks);
            }
            setBanksLoading(false);
        };
        loadBanks();
    }, []);

    // auto-resolve account name when account number is 10 digits and bank is selected
    useEffect(() => {
        const { accountNumber, bankCode } = formDetails;
        if (accountNumber.length === 10 && bankCode) {
            const resolve = async () => {
                setResolving(true);
                setBankError("");
                setResolvedName("");
                const result = await verifyAccount(accountNumber, bankCode);
                if (result.error) {
                    setBankError("Account not found. Check the number and selected bank.");
                } else {
                    setResolvedName(result.accountName);
                }
                setResolving(false);
            };
            resolve();
        } else {
            setResolvedName("");
            setBankError("");
        }
    }, [formDetails.accountNumber, formDetails.bankCode]);

     const handleChange = (e) => {
        let { name, value } = e.target;

         // If they are typing in the WhatsApp field, instantly remove any + signs
    if (name === "whatsappNumber") {
        value = value.replace(/\+/g, "");
    }

        setFormDetails((prev) => ({ ...prev, [name]: value }));
    };


    const handleBankChange = (e) => {
        const selected = banks.find((b) => b.code === e.target.value);
        if (selected) {
            setFormDetails((prev) => ({
                ...prev,
                bankCode: selected.code,
                bankName: selected.name,
            }));
        } else {
            setFormDetails((prev) => ({ ...prev, bankCode: "", bankName: "" }));
        }
    };

        const validateStep1 = () => {
        if (!formDetails.businessName.trim()) return "Business name is required";
        if (!formDetails.email.trim()) return "Email is required";
        if (!formDetails.password || formDetails.password.length < 6) return "Password must be at least 6 characters";
        if (!formDetails.whatsappNumber.trim()) return "WhatsApp number is required";
        return null;
    };

     const validateStep2 = () => {
        if (!formDetails.bankCode) return "Please select a bank";
        if (!formDetails.accountNumber || formDetails.accountNumber.length !== 10) return "Enter a valid 10-digit account number";
        if (!resolvedName) return "Account name could not be resolved. Check your details.";
        return null;
    };

    //check if there is any error in step 1
    const handleNextStep = () => {
        setError("");
        const err = validateStep1();
        if (err) {
            setError(err);
            return;
        }
        setStep(2);
    };

    //check if there is any error in step 2
    const handleSubmit = async () => {
        setError("");
        const err = validateStep2();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);


         const payload = {
            businessName: formDetails.businessName.trim(),
            email: formDetails.email.trim(),
            password: formDetails.password,
            whatsappNumber: formDetails.whatsappNumber.trim(),
            bankDetails: {
                accountNumber: formDetails.accountNumber,
                bankCode: formDetails.bankCode,
                bankName: formDetails.bankName,
                accountName: resolvedName,
            },
            referredBy: formDetails.referredBy.trim() || undefined,
        };

        const result = await registerSeller(payload);

        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }
        // save token and seller to localStorage
        localStorage.setItem("token", result.token);
        localStorage.setItem("seller", JSON.stringify(result.seller));

        setLoading(false);
        navigate("/dashboard");
    };


     const renderStep1 = () => {
        return (
            <div className={styles.formSection}>
                <p className={styles.sectionTitle}>Business Details</p>

                <div className={styles.field}>
                    <label className={styles.label}>Business Name</label>
                    <input
                        className={styles.input}
                        type="text"
                        name="businessName"
                        placeholder="e.g. Chinwe Fashion"
                        value={formDetails.businessName}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Email Address</label>
                    <input
                        className={styles.input}
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formDetails.email}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Password</label>
                    <div className={styles.passwordWrapper}>
                        <input
                            className={styles.input}
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Minimum 6 characters"
                            value={formDetails.password}
                            onChange={handleChange}
                        />
                        <button
                            className={styles.eyeBtn}
                            onClick={() => setShowPassword((prev) => !prev)}
                            type="button"
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>WhatsApp Number</label>
                    <input
                        className={styles.input}
                        type="tel"
                        name="whatsappNumber"
                        placeholder="e.g. 2348012345678"
                        value={formDetails.whatsappNumber}
                        onChange={handleChange}
                    />
                    <p className={styles.hint}>Include country code. No + sign. e.g. 2348012345678</p>
                </div>

                {error ? <p className={styles.error}>{error}</p> : null}

                <button className={styles.primaryBtn} onClick={handleNextStep}>
                    Continue
                </button>
            </div>
        );
    };

    const renderStep2 = () => {
        return (
            <div className={styles.formSection}>
                <p className={styles.sectionTitle}>Bank Details</p>
                <p className={styles.sectionHint}>
                    This is the account where your sales income will be sent daily.
                </p>

                <div className={styles.field}>
                    <label className={styles.label}>Select Bank</label>
                    {banksLoading ? (
                        <p className={styles.hint}>Loading banks...</p>
                    ) : (
                        <select
                            className={styles.input}
                            value={formDetails.bankCode}
                            onChange={handleBankChange}
                        >
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
                        name="accountNumber"
                        placeholder="10-digit account number"
                        maxLength={10}
                        value={formDetails.accountNumber}
                        onChange={handleChange}
                    />
                    {resolving ? (
                        <p className={styles.hint}>Verifying account...</p>
                    ) : null}
                    {resolvedName && !resolving ? (
                        <p className={styles.resolvedName}>✓ {resolvedName}</p>
                    ) : null}
                    {bankError && !resolving ? (
                        <p className={styles.error}>{bankError}</p>
                    ) : null}
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        Referral Code{" "}
                        <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                        className={refFromUrl ? `${styles.input} ${styles.lockedInput}` : styles.input}
                        type="text"
                        name="referredBy"
                        placeholder="e.g. 482910"
                        value={formDetails.referredBy}
                        onChange={handleChange}
                        disabled={refFromUrl}
                    />
                    {refFromUrl ? (
        <p className={styles.appliedMsg}>✓ Referral code automatically applied!</p>
    ) : null}
                </div>

                {error ? <p className={styles.error}>{error}</p> : null}

                <button
                    className={styles.primaryBtn}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Creating your store..." : "Create My Store"}
                </button>

                <button
                    className={styles.backBtn}
                    onClick={() => { setError(""); setStep(1); }}
                >
                    ← Back
                </button>
            </div>
        );
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                {/* header */}
                <div className={styles.header}>
                    <h1 className={styles.brand}> MoonStore</h1>
                    <p className={styles.subtitle}>Create your store</p>
                </div>

                {/* step indicator */}
                <div className={styles.steps}>
                    <div className={step >= 1 ? `${styles.step} ${styles.activeStep}` : styles.step}>
                        1
                    </div>
                    <div className={styles.stepLine} />
                    <div className={step >= 2 ? `${styles.step} ${styles.activeStep}` : styles.step}>
                        2
                    </div>
                </div>

                {/* form */}
                {step === 1 ? renderStep1() : renderStep2()}

                {/* login link */}
                <p className={styles.loginLink}>
                    Already have an account?{" "}
                    <button
                        className={styles.linkBtn}
                        onClick={() => navigate("/login")}
                    >
                        Log in
                    </button>
                </p>
            </div>
        </div>
    );

}

export default SignupPage;