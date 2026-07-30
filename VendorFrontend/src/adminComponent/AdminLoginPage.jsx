import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/api";
import styles from "./AdminLoginPage.module.css";

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [passkey, setPasskey] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!passkey.trim()) {
            setError("Enter the admin passkey");
            return;
        }
        setLoading(true);
        setError("");

        const data = await adminLogin(passkey.trim());

        if (data?.error) {
            setError(data.error);
            setLoading(false);
            return;
        }

        localStorage.setItem("moonstore_admin_token", data.token);
        navigate("/admin/revenue");
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Admin Login</h1>
            <input
                type="password"
                className={styles.input}
                placeholder="Enter admin passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
            />
            {error ? <p className={styles.error}>{error}</p> : null}
            <button className={styles.loginBtn} onClick={handleLogin} disabled={loading}>
                {loading ? "Checking..." : "Login"}
            </button>
        </div>
    );
};

export default AdminLoginPage;