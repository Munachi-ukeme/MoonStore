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

// moved outside component — stable references, no recreation on render
const CACHE_TTL = 5 * 60 * 1000;
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

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>Loading store...</p>
            </div>
        );
    }

    if (error) {
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
            <CategoryTabs
                categories={Array.isArray(categories) ? categories : []}
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