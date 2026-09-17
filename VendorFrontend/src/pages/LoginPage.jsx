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

    // Listen for global maintenance events
    useEffect(() => {
        const handleMaintenance = () => setIsMaintenance(true);
        window.addEventListener("maintenance_active", handleMaintenance);
        return () => window.removeEventListener("maintenance_active", handleMaintenance);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const data = await loginSeller(email, password);

        setLoading(false);

        // Check for error or direct maintenance signal from API response
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
    };

    // Render overlay if backend signals maintenance mode
    if (isMaintenance) {
        return <MaintenanceOverlay />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>MoonStore</h1>
                <p className={styles.subtitle}>Sign in to your dashboard</p>

                {error && <p className={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>Email:</label>
                        <input
                            type="email" 
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@gmail.com"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password:</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
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
                            Signup
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