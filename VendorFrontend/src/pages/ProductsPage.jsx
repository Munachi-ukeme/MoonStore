import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getCategories, getProducts } from "../api/api";
import ProductForm from "../sellerComponent/ProductForm";
import ProductTable from "../sellerComponent/ProductTable";
import styles from "./ProductsPage.module.css";

function ProductsPage() {
    const { seller } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tipDismissed, setTipDismissed] = useState(() => {
        return localStorage.getItem("moonstore_tip_dismissed") === "true";
    });

    useEffect(() => {
        const loadData = async () => {
            setError(null);
            setLoading(true);
            const [productsData, categoriesData] = await Promise.all([
                getProducts(),
                getCategories(),
            ]);

            if (productsData.error) {
                setError(productsData.error);
                setLoading(false);
                return;
            }

            setProducts(productsData);
            setCategories(categoriesData || []);
            setLoading(false);
        };
        loadData();
    }, []);

    const handleDismissTip = () => {
        localStorage.setItem("moonstore_tip_dismissed", "true");
        setTipDismissed(true);
    };

    const handleAddClick = () => {
        setEditingProduct(null);
        setShowForm(true);
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleCancel = () => {
        setEditingProduct(null);
        setShowForm(false);
    };

    const handleSaved = (savedProduct) => {
        if (editingProduct) {
            setProducts(products.map((p) => {
                if (p._id === savedProduct._id) return savedProduct;
                return p;
            }));
        } else {
            setProducts([savedProduct, ...products]);
        }
        setEditingProduct(null);
        setShowForm(false);
    };

    const handleDeleted = (deleteId) => {
        setProducts(products.filter((p) => p._id !== deleteId));
    };

    const handleStockToggle = (productId, newStockStatus) => {
        setProducts(products.map((p) => {
            if (p._id === productId) return { ...p, inStock: newStockStatus };
            return p;
        }));
    };

    return (
        <div className={styles.container}>

            {/* tip card */}
            {!tipDismissed && !showForm ? (
                <div className={styles.tipCard}>
                    <div className={styles.tipTop}>
                        <span className={styles.tipIcon}>💡</span>
                        <button className={styles.tipClose} onClick={handleDismissTip}>✕</button>
                    </div>
                    <p className={styles.tipText}>
                        <strong>Pro tip:</strong> Add your product link alongside every product you post on Instagram, WhatsApp, or any social media. When buyers tap the link, they can order directly from your store and they'll get used to ordering online instead of through WhatsApp chat.
                    </p>
                </div>
            ) : null}

            <div className={styles.header}>
                {showForm ? null : (
                    <button className={styles.addButton} onClick={handleAddClick}>
                        Add Product
                    </button>
                )}
            </div>

            {error ? (
                <div className={styles.errorRow}>
                    <p className={styles.error}>{error}</p>
                </div>
            ) : null}

            {loading ? (
                <p className={styles.loading}>Loading products...</p>
            ) : null}

            {showForm ? (
                <ProductForm
                    editingProduct={editingProduct}
                    onSaved={handleSaved}
                    onCancel={handleCancel}
                />
            ) : null}

            {loading ? null : (
                <ProductTable
                    products={products}
                    categories={categories}
                    onEdit={handleEditClick}
                    onDeleted={handleDeleted}
                    onStockToggle={handleStockToggle}
                    sellerSlug={seller?.slug}
                />
            )}
        </div>
    );
}

export default ProductsPage;