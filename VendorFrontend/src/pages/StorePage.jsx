import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getStore, trackStoreVisit } from "../api/api";
import { getOrCreateSessionId, getSavedEmail, wasPopupDismissed } from "../utils/session";
import Navbar from "../buyerComponent/Navbar";
import HeroSection from "../buyerComponent/HeroSection";
import CategoryTabs from "../buyerComponent/CategoryTabs";
import ProductGrid from "../buyerComponent/ProductGrid";
import Footer from "../buyerComponent/Footer";
import styles from "./StorePage.module.css";
import StoreBottomNav from "../buyerComponent/StoreBottomNav";
import EmailCapturePopup from "../buyerComponent/EmailCapturePopup";
import OrderTray from "../buyerComponent/OrderTray";
import SearchBar from "../buyerComponent/SearchBar";

// moved outside component — stable references, no recreation on render
const CACHE_TTL = 3 * 60 * 1000;
const getCacheKey = (slug) => `moonstore_store_${slug}`;

function StorePage() {
    const { slug } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEmailPopup, setShowEmailPopup] = useState(false);
    const [errorStatus, setErrorStatus] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");
const [searchTerm, setSearchTerm] = useState("");

    const loadStore = useCallback(async () => {
        setError(null);
        setLoading(true);

        try {
            const cached = localStorage.getItem(getCacheKey(slug));
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    setStore(data.store);
                    setProducts(data.products);
                    setCategories(data.categories);
                    setFilteredProducts(data.products);
                    setLoading(false);
                    return;
                }
            }
        } catch {
            // ignore
        }

        const data = await getStore(slug);

        if (data.error) {
            setError(data.error);
            setErrorStatus(data.status)
            setLoading(false);
            return;
        }

        try {
            localStorage.setItem(getCacheKey(slug), JSON.stringify({
                data,
                timestamp: Date.now(),
            }));
        } catch {
            // ignore
        }

        setStore(data.store);
        setProducts(data.products);
        setCategories(data.categories);
        setFilteredProducts(data.products);
        setLoading(false);

        if (data.store && data.store._id) {
            trackStoreVisit({
                sellerId: data.store._id,
                sessionId: getOrCreateSessionId(),
                referrer: document.referrer || "",
            });
        }
    }, [slug]);

    useEffect(() => {
        loadStore();
    }, [loadStore]);

    useEffect(() => {
        const alreadySaved = getSavedEmail();
        const dismissed = wasPopupDismissed();
        if (alreadySaved || dismissed) return;
        const timer = setTimeout(() => {
            setShowEmailPopup(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleSelectCategory = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm("");

    if (categoryId === "all") {
        setFilteredProducts(products);
        return;
    }

    const filtered = products.filter((product) => {
        const productCategoryId = typeof product.categoryId === "object"
            ? product.categoryId._id
            : product.categoryId;
        return productCategoryId === categoryId;
    });
    setFilteredProducts(filtered);
};

const handleSearchChange = (value) => {
    setSearchTerm(value);

    if (value.trim() === "") {
        handleSelectCategory(activeCategory);
        return;
    }

    setActiveCategory("all");

    const lowerValue = value.toLowerCase();
    const filtered = products.filter((product) => {
        const nameMatch = product.name?.toLowerCase().includes(lowerValue);
        const descriptionMatch = product.description?.toLowerCase().includes(lowerValue);
        return nameMatch || descriptionMatch;
    });
    setFilteredProducts(filtered);
};

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>Loading store...</p>
            </div>
        );
    }

    if (error) {
    if (errorStatus === 404) {
        return (
            <div className={styles.blankState}>
                <p className={styles.blankTitle}>Store does not exist</p>
                <p className={styles.blankText}>Check the store link or contact the seller you are trying to shop from.</p>
            </div>
        );
    }

    if (errorStatus === 403) {
        return (
            <div className={styles.blankState}>
                <p className={styles.blankTitle}>Store temporarily unavailable</p>
                <p className={styles.blankText}>This store is currently paused by the seller.</p>
            </div>
        );
    }

    return (
        <div className={styles.errorContainer}>
            <p className={styles.errorTitle}>{error}</p>
            <button className={styles.retryBtn} onClick={loadStore}>
                Try Again
            </button>
        </div>
    );
}

    return (
        <div className={styles.container}>
            <Navbar store={store} />
            <HeroSection store={store} />

            <SearchBar
    value={searchTerm}
    onChange={handleSearchChange}
/>

            <CategoryTabs
    categories={Array.isArray(categories) ? categories : []}
    activeTab={activeCategory}
    onSelectCategory={handleSelectCategory}
/>

            <ProductGrid
    products={Array.isArray(filteredProducts) ? filteredProducts : []}
    slug={slug}
/>
            <Footer store={store} />
            <OrderTray slug={slug} />
            <StoreBottomNav sellerId={store?._id} slug={store?.slug} />
            <EmailCapturePopup
                show={showEmailPopup}
                onClose={() => setShowEmailPopup(false)}
                sellerId={store?._id}
            />
        </div>
    );
}

export default StorePage;