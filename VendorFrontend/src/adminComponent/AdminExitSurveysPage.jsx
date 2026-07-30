import { useEffect, useState } from "react";
import { getExitSurveys } from "../api/api";
import styles from "./AdminExitSurveysPage.module.css";

const AdminExitSurveysPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSurveys = async () => {
      const data = await getExitSurveys();

      if (data?.error) {
        setError(data.error);
      } else {
        setSurveys(data.exitSurveys);
      }

      setInitialLoading(false);
    };

    fetchSurveys();
  }, []);

  if (initialLoading) {
    return <p className={styles.loading}>Loading exit surveys...</p>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Exit Surveys</h2>

      {error ? <p className={styles.error}>{error}</p> : null}

      {surveys.length === 0 ? (
        <p className={styles.empty}>No exit surveys yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Reason</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((survey) => (
              <tr key={survey._id}>
                <td>{survey.businessName}</td>
                <td>{survey.email}</td>
                <td>{survey.plan}</td>
                <td className={styles.reasonCell}>{survey.reason}</td>
                <td>{new Date(survey.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminExitSurveysPage;