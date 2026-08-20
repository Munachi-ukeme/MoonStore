import { useState, useEffect } from "react";
import {
    getAllSellers,
    activateStore,
    deactivateStore,
    deleteSellerAdmin,
} from "../api/api";
import styles from "./AdminSellersPage.module.css";
import DateRangeFilter from "../adminComponent/DateRangeFilter";

const AdminSellersPage = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null); // tracks which row's button is busy
    const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");


    const loadSellers = async () => {
        setLoading(true);
        const data = await getAllSellers();
        if (data.error) {
            setError(data.error);
        } else {
            setSellers(data.sellers || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadSellers();
    }, []);

    const handleActivate = async (email) => {
        setActionLoading(email);
        await activateStore(email);
        await loadSellers();
        setActionLoading(null);
    };

    const handleDeactivate = async (email) => {
        setActionLoading(email);
        await deactivateStore(email);
        await loadSellers();
        setActionLoading(null);
    };

    const handleDelete = async (email, businessName) => {
        const confirmed = window.confirm(
            `Delete ${businessName}? This permanently removes their store, products, and conversations.`
        );
        if (!confirmed) return;

        setActionLoading(email);
        await deleteSellerAdmin(email);
        await loadSellers();
        setActionLoading(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
        seller.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && seller.isActive) ||
        (statusFilter === "inactive" && !seller.isActive);

    const joinedDate = new Date(seller.joinedDate);
    const matchesStartDate = !startDate || joinedDate >= new Date(startDate);
    const matchesEndDate = !endDate || joinedDate <= new Date(endDate);

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
});

    if (loading) return <p className={styles.stateText}>Loading sellers...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Sellers ({sellers.length})</h1>


        <div className={styles.filterRow}>
    <input
        type="text"
        className={styles.searchInput}
        placeholder="Search by business name or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
    />
    <select
        className={styles.statusSelect}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
    >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
    </select>

    <DateRangeFilter onChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
</div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Business</th>
                            <th>Heard Via</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSellers.map((seller) => (
                            <tr key={seller.email}>
                                <td>
                                    <p className={styles.bizName}>{seller.businessName}</p>
                                    <p className={styles.slugText}>/{seller.slug}</p>
                                </td>

                                                                <td>
                                    {seller.howHeardAboutUs === "Other" && seller.howHeardAboutUsOther
                                        ? `Other: ${seller.howHeardAboutUsOther}`
                                        : seller.howHeardAboutUs || "—"}
                                </td>
                                
                                <td>
                                    <span
                                        className={
                                            seller.isActive ? styles.activeBadge : styles.inactiveBadge
                                        }
                                    >
                                        {seller.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                
                                <td>{formatDate(seller.joinedDate)}</td>
                                <td className={styles.actionsCell}>
                                    {seller.isActive ? (
                                        <button
                                            className={styles.deactivateBtn}
                                            disabled={actionLoading === seller.email}
                                            onClick={() => handleDeactivate(seller.email)}
                                        >
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.activateBtn}
                                            disabled={actionLoading === seller.email}
                                            onClick={() => handleActivate(seller.email)}
                                        >
                                            Activate
                                        </button>
                                    )}
                                    <button
                                        className={styles.deleteBtn}
                                        disabled={actionLoading === seller.email}
                                        onClick={() => handleDelete(seller.email, seller.businessName)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSellersPage;