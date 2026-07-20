import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/api";
import styles from "./ResetPasswordPage.module.css";

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!newPassword || !confirmPassword) {
            setError("Please fill in both fields");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        const data = await resetPassword(token, newPassword);

        if (data?.error) {
            setError(data.error);
            setLoading(false);
            return;
        }

        if (data?.message === "Password reset successful") {
            setSuccess(true);
            setLoading(false);
            setTimeout(() => navigate("/login"), 2000);
        } else {
            setError(data?.message || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Reset Password</h1>

            {success ? (
                <p className={styles.successText}>
                    Password reset successful. Redirecting to login...
                </p>
            ) : (
                <div className={styles.form}>
                    <input
                        type="password"
                        className={styles.input}
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        className={styles.input}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {error ? <p className={styles.error}>{error}</p> : null}
                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResetPasswordPage;