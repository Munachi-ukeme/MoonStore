import { Component } from "react";
import styles from "./ErrorBoundary.module.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }


  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <p className={styles.title}>Something went wrong.</p>
          <p className={styles.message}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            className={styles.retryBtn}
            onClick={() => this.handleReset()}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
