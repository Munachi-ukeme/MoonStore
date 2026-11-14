import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerSeller, getBanks, verifyAccount, requestSignupConfirmation, verifySignupToken } from "../api/api";
import styles from "./SignupPage.module.css";

const SignupPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get("token");

    const [step, setStep] = useState(1);
    const [checkingToken, setCheckingToken] = useState(!!tokenFromUrl);
    const [tokenError, setTokenError] = useState("");
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

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
        howHeardAboutUs: "",
        howHeardAboutUsOther: "",
        accountNumber: "",
        bankCode: "",
        bankName: "",
        identifier: "",
        dateOfBirth: "",
    });

    const [consentChecked, setConsentChecked] = useState(false);

    // holds the verified, hashed step 1 data once the email link is confirmed
    const [confirmedData, setConfirmedData] = useState(null);

    // if a signup token is in the URL, verify it on load and jump straight to step 2
    useEffect(() => {
        if (!tokenFromUrl) return;

        const verify = async () => {
            setCheckingToken(true);
            const result = await verifySignupToken(tokenFromUrl);
            setCheckingToken(false);

            if (result.error) {
                setTokenError(result.error);
                return;
            }

            setConfirmedData(result);
            setFormDetails((prev) => ({
                ...prev,
                businessName: result.businessName,
                email: result.email,
                whatsappNumber: result.whatsappNumber,
                howHeardAboutUs: result.howHeardAboutUs || "",
                howHeardAboutUsOther: result.howHeardAboutUsOther || "",
                referredBy: result.referredBy || "",
            }));
            if (result.referredBy) setRefFromUrl(true);
            setStep(2);
        };

        verify();
    }, [tokenFromUrl]);
    

    // fetch bank list on mount
    useEffect(() => {
        const loadBanks = async () => {
            setBanksLoading(true);
            const result = await getBanks();
            if (!result.error && result.banks) {
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
        if (name === "whatsappNumber") {
            value = value.replace(/\+/g, "");
        }
        if (name === "identifier") {
            value = value.replace(/\D/g, "").slice(0, 11);
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
        if (formDetails.whatsappNumber.length !== 13) {
            return "WhatsApp number must be exactly 13 digits";
        }
        if (!formDetails.whatsappNumber.startsWith("234")) {
            return "MoonStore is currently only available to sellers in Nigeria.";
        }
        if (!formDetails.howHeardAboutUs) return "Please tell us how you heard about MoonStore";
        if (formDetails.howHeardAboutUs === "Other" && !formDetails.howHeardAboutUsOther.trim()) {
            return "Please tell us where you heard about MoonStore";
    }
};

       const validateStep2 = () => {
        if (!/^\d{11}$/.test(formDetails.identifier)) return "Enter your 11-digit NIN";
        if (!formDetails.dateOfBirth) return "Enter your date of birth";
        if (new Date(formDetails.dateOfBirth) > new Date()) return "Enter a valid date of birth";
        if (!consentChecked) return "Please agree to identity verification to continue";
        if (!formDetails.bankCode) return "Please select a bank";
        if (!formDetails.accountNumber || formDetails.accountNumber.length !== 10) return "Enter a valid 10-digit account number";
        if (!resolvedName) return "Account name could not be resolved. Check your details.";
        return null;
    };

    // step 1 "Continue" now requests an email confirmation instead of moving straight to step 2
    const handleNextStep = async () => {
        setError("");
        const err = validateStep1();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        const result = await requestSignupConfirmation({
            businessName: formDetails.businessName.trim(),
            email: formDetails.email.trim(),
            password: formDetails.password,
            whatsappNumber: formDetails.whatsappNumber.trim(),
            howHeardAboutUs: formDetails.howHeardAboutUs,
            howHeardAboutUsOther: formDetails.howHeardAboutUs === "Other" ? formDetails.howHeardAboutUsOther.trim() : "",
            referredBy: formDetails.referredBy.trim() || undefined,
        });
        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        setAwaitingConfirmation(true);
    };

        const handleSubmit = async () => {
        setError("");

        if (!confirmedData) {
            setError("Your session expired. Please start signup again.");
            setTimeout(() => navigate("/register"), 2000);
            return;
        }

        const err = validateStep2();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);

        const payload = {
            signupToken: tokenFromUrl,
            businessName: confirmedData.businessName,
            email: confirmedData.email,
            hashedPassword: confirmedData.hashedPassword,
            whatsappNumber: confirmedData.whatsappNumber,
            howHeardAboutUs: confirmedData.howHeardAboutUs,
            howHeardAboutUsOther: confirmedData.howHeardAboutUsOther || "",
            identifier: formDetails.identifier,
            dateOfBirth: formDetails.dateOfBirth,
            consent: true,
            bankDetails: {
                accountNumber: formDetails.accountNumber,
                bankCode: formDetails.bankCode,
                bankName: formDetails.bankName,
                accountName: resolvedName,
            },
        };

        const result = await registerSeller(payload);

        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        login(result.token, result.seller);
        setLoading(false);
        navigate("/dashboard", { state: { justSignedUp: true } });
    };

    const renderStep1 = () => {
        if (awaitingConfirmation) {
            return (
                <div className={styles.formSection}>
                    <p className={styles.sectionTitle}>Check your email</p>
                    <p className={styles.sectionHint}>
                        We sent a confirmation link to <strong>{formDetails.email}</strong>. Click it
                        to continue setting up your store. The link expires in 30 minutes.
                    </p>
                </div>
            );
        }

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

                <div className={styles.field}>
                    <label className={styles.label}>How did you hear about us?</label>
                    <select
                        className={styles.input}
                        name="howHeardAboutUs"
                        value={formDetails.howHeardAboutUs}
                        onChange={handleChange}
                    >
                        <option value="">-- Select an option --</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Threads">Threads</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Referred by a friend">Referred by a friend</option>
                        <option value="Instagram">Ads</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Other">Other</option>
                    </select>

                    {formDetails.howHeardAboutUs === "Other" ? (
                        <input
                            className={styles.input}
                            style={{ marginTop: "8px" }}
                            type="text"
                            name="howHeardAboutUsOther"
                            placeholder="Please tell us where"
                            value={formDetails.howHeardAboutUsOther}
                            onChange={handleChange}
                        />
                    ) : null}
                </div>

                {error ? <p className={styles.error}>{error}</p> : null}

                <button className={styles.primaryBtn} onClick={handleNextStep} disabled={loading}>
                    {loading ? "Sending confirmation..." : "Continue"}
                </button>
            </div>
        );
    };

       const renderStep2 = () => {
        return (
            <div className={styles.formSection}>
                <p className={styles.sectionTitle}>Verify Your Identity</p>

                <div className={styles.infoBox}>
                    🔒 Buyers' payments are not held by MoonStore. They are held safely until delivery by Rubies Microfinance Bank, a bank licensed by the Central Bank of Nigeria, through our payment partner EscrowPay. EscrowPay verifies every seller's identity once before they can receive payments. Enter your NIN and date of birth exactly as they appear on your NIN record. Your NIN is sent securely to EscrowPay for verification and is never stored by MoonStore.
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>NIN</label>
                    <input
                        className={styles.input}
                        type="text"
                        inputMode="numeric"
                        name="identifier"
                        placeholder="11-digit NIN"
                        maxLength={11}
                        value={formDetails.identifier}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Date of Birth</label>
                    <input
                        className={styles.input}
                        type="date"
                        name="dateOfBirth"
                        max={new Date().toISOString().split("T")[0]}
                        value={formDetails.dateOfBirth}
                        onChange={handleChange}
                    />
                </div>

                <label className={styles.consentRow}>
                    <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                    />
                    <span>I agree that EscrowPay, a third party, verifies my identity, and that my payment is held by a licensed bank.</span>
                </label>

                <p className={styles.sectionTitle}>Bank Details</p>

                <div className={styles.warningBox}>
                    ⚠️ Double-check this is the correct bank account before continuing.
                    This is where your sales money will be sent. MoonStore cannot
                    recover funds sent to the wrong account.
                </div>

                <div className={styles.infoBox}>
                    💡 Payments are held safely by Rubies Microfinance Bank (CBN-licensed) until the buyer confirms delivery or
                    the delivery window ends, then released to you.
                </div>

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

                {error ? <p className={styles.error}>{error}</p> : null}

                <button
                    className={styles.primaryBtn}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Verifying and creating your store..." : "Verify & Create My Store"}
                </button>
            </div>
        );
    };

    if (checkingToken) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <p className={styles.sectionHint}>Confirming your email...</p>
                </div>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <p className={styles.error}>{tokenError}</p>
                    <button className={styles.primaryBtn} onClick={() => navigate("/register")}>
                        Start Signup Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.brand}> MoonStore</h1>
                    <p className={styles.subtitle}>Create your store</p>
                </div>

                <div className={styles.steps}>
                    <div className={step >= 1 ? `${styles.step} ${styles.activeStep}` : styles.step}>
                        1
                    </div>
                    <div className={styles.stepLine} />
                    <div className={step >= 2 ? `${styles.step} ${styles.activeStep}` : styles.step}>
                        2
                    </div>
                </div>

                {step === 1 ? renderStep1() : renderStep2()}

                {step === 1 && !awaitingConfirmation ? (
                    <>
                        <p className={styles.loginLink}>
                            Already have an account?{" "}
                            <button className={styles.linkBtn} onClick={() => navigate("/login")}>
                                Log in
                            </button>
                        </p>

                        <p className={styles.buyerLink}>
                            I'm a buyer{" "}
                            <button className={styles.linkBtn} onClick={() => navigate("/")}>
                                Login
                            </button>
                        </p>
                    </>
                ) : null}
            </div>
        </div>
    );
};


export default SignupPage;