import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginSeller } from "../api/api";
import styles from "./LoginPage.module.css";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    //login() comes from Authcontent, saves token and seller to localstorage and state
    const { login } = useAuth();
    const handleSubmit = async (e) =>{
        e.preventDefault(); //this prevent broswer to refresh the page on form submit
    setError(null);
    setLoading(true);

    const data = await loginSeller(email, password); //this calls backend through login api

    setLoading(false); //this stops loading once the data have been fetched

    //if the backend returned an error, show it and stop
    if (data.error || !data.token) {
        setError(data.error || "Login failed. Please try again.");
        return;
    }

    //if login was successful, save to AuthContext
    //This updates isAuthenticated to true across the entire app
    login(data.token, data.seller);

    //Redirect seller to their dashboard
    navigate("/dashboard");
    };

    return(
        <div className={styles.container}>
            <div className={styles.card}>

                <h1 className={styles.title}>MoonStore</h1>
                <p className={styles.subtitle}>Sign in to your dashboard</p>

                {/* Only shows if there's an error */}
                {error && <p className={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>

                    <div className={styles.field}>
                        <label className={styles.label}>Email:</label>
                        <input
                        type="email" 
                        className={styles.input}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password:</label>
                        <input
                        type="password"
                        className={styles.input}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your password"
                        required
                        />
                    </div>

                    <button
                    type="submit"
                    className={styles.button}
                    disabled={loading}
                    >
                        {/* Shows different text depending on loading state */}
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default LoginPage;