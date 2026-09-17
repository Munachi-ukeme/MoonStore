// components/MaintenanceOverlay.jsx
import styles from './MaintenanceOverlay.module.css';

export const MaintenanceOverlay = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.brandBadge}>MoonStore</div>
        <h1 className={styles.title}>Under Maintenance</h1>
        <p className={styles.message}>
          The system is currently undergoing scheduled upgrades to improve your checkout experience. Please check back shortly.
        </p>
      </div>
    </div>
  );
};