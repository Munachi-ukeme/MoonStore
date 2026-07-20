import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/api";
import styles from "./ForgotPasswordPage.module.css";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError("Please enter your email");
            return;
        }
        setLoading(true);
        setError("");

        const data = await forgotPassword(email.trim());

        if (data?.error) {
            setError(data.error);
            setLoading(false);
            return;
        }

        setSubmitted(true);
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Forgot Password</h1>

            {submitted ? (
                <p className={styles.successText}>
                    If that email is registered, a reset link has been sent.
                    Check your inbox, the link expires in 5 minutes.
                </p>
            ) : (
                <div className={styles.form}>
                    <p className={styles.subtitle}>
                        Enter your email and we'll send you a reset link.
                    </p>
                    <input
                        type="email"
                        className={styles.input}
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {error ? <p className={styles.error}>{error}</p> : null}
                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </div>
            )}

            <Link to="/login" className={styles.backLink}>
                Back to Login
            </Link>
        </div>
    );
};

export default ForgotPasswordPage;