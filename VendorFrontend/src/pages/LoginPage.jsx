
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginSeller } from "../api/api";
import { MaintenanceOverlay } from "../sellerComponent/MaintenanceOverlay";
import styles from "./LoginPage.module.css";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isMaintenance, setIsMaintenance] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const handleMaintenance = () => setIsMaintenance(true);

        window.addEventListener("maintenance_active", handleMaintenance);

        return () => {
            window.removeEventListener(
                "maintenance_active",
                handleMaintenance
            );
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await loginSeller(email.trim(), password);

            if (data.isMaintenance) {
                setIsMaintenance(true);
                return;
            }

            if (data.error || !data.token) {
                setError(data.error || "Login failed. Please try again.");
                return;
            }

            login(data.token, data.seller);
            navigate("/dashboard");
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (isMaintenance) {
        return <MaintenanceOverlay />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>MoonStore</h1>

                <p className={styles.subtitle}>
                    Sign in to your dashboard
                </p>

                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="seller-email" className={styles.label}>
                            Email
                        </label>

                        <input
                            id="seller-email"
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@gmail.com"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label
                            htmlFor="seller-password"
                            className={styles.label}
                        >
                            Password
                        </label>

                        <div className={styles.passwordWrapper}>
                            <input
                                id="seller-password"
                                type={showPassword ? "text" : "password"}
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                            />

                            <button
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword((prev) => !prev)}
                                type="button"
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                    <p className={styles.resetPasswordLink}>
                        Forgot password?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            className={styles.linkBtn}
                        >
                            Reset
                        </button>
                    </p>

                    <p className={styles.registerLink}>
                        Don't have an account?{" "}
                        <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => navigate("/register")}
                        >
                            Sign up
                        </button>
                    </p>

                    <p className={styles.buyerLink}>
                        I'm a buyer{" "}
                        <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => navigate("/")}
                        >
                            Login
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
