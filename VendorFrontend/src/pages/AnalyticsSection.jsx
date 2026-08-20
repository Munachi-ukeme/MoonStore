import { useState, useEffect, useCallback } from "react";
import { getAnalyticsSummary } from "../api/api";
import styles from "./AnalyticsSection.module.css";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
];


const AnalyticsSection = () => {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchAnalytics = useCallback(async () => {
      setLoading(true);
      setError(null);
      const result = await getAnalyticsSummary(period);
      if (result.error) {
    setError("Could not load analytics.");
      } else {
         setData(result);
      }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
}, [fetchAnalytics]);

   const cards = data
    ? [
        {
         label: "Total Sales",
         value: `₦${data.totalSales.toLocaleString()}`,
         },

          {
          label: "Your Earnings",
          value: `₦${data.sellerEarnings.toLocaleString()}`,
        },

        {
          label: "Pending Settlement",
          value: `₦${data.pendingPayments.toLocaleString()}`,
        },

        {
          label: "Store Visits",
          value: data.storeVisits,
        },

        {
          label: "Orders",
          value: data.orders,
        },

        {
          label: "Products Sold",
          value: data.productsSold,
        },        
      ]
    : [];


    return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <p className={styles.sectionLabel}>Analytics</p>
        <select
          className={styles.periodSelect}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
  <div className={styles.errorRow}>
    <p className={styles.errorText}>{error}</p>
    <button className={styles.retryBtn} onClick={fetchAnalytics}>
      Try Again
    </button>
  </div>
) : null}

      {loading ? (
        <p className={styles.loadingText}>Loading analytics...</p>
        
      ) : (
        <div className={styles.scrollRow}>
          {cards.map((card) => (
            <div key={card.label} className={styles.card}>
              <p className={styles.cardLabel}>{card.label}</p>
              <p className={styles.cardValue}>{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsSection;