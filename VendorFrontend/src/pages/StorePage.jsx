import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getStore } from "../api/api";
import { trackStoreVisit } from "../api/api";
import { getOrCreateSessionId } from "../utils/session";
import Navbar from "../buyerComponent/Navbar";
import HeroSection from "../buyerComponent/HeroSection";
import CategoryTabs from "../buyerComponent/CategoryTabs";
import ProductGrid from "../buyerComponent/ProductGrid";
import Footer from "../buyerComponent/Footer";
import styles from "./StorePage.module.css";
import StoreBottomNav from "../buyerComponent/StoreBottomNav";
import EmailCapturePopup from "../buyerComponent/EmailCapturePopup";
import { getSavedEmail, wasPopupDismissed } from "../utils/session";
import OrderTray from "../buyerComponent/OrderTray";

function StorePage() {
    const { slug } = useParams();

    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEmailPopup, setShowEmailPopup] = useState(false);

    const CACHE_KEY = `moonstore_store_${slug}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes


    // fetch store data when page loads
    useEffect(() => {
        const loadStore = async () =>{
            setError(null);
            setLoading(true);

            // check cache first
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_TTL) {
                        setStore(data.store);
                        setProducts(data.products);
                        setCategories(data);
                        setFilteredProducts(data.products);
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // cache read failed — continue to fetch
            }
            const data = await getStore(slug);

            if (data.error) {
                setError(data.error);
                setLoading(false);
                return;
            }

             // save to cache
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    data,
                    timestamp: Date.now(),
                }));
            } catch {
                
            }

            // backend return { store, products, categories}
            setStore(data.store);
            setProducts(data.products);
            setCategories(data.categories);
            setFilteredProducts(data.products);
            setLoading(false);

             if (data.store && data.store.seller) {
             trackStoreVisit({
             sellerId: data.store.seller._id,
             sessionId: getOrCreateSessionId(),
             referrer: document.referrer || "",
            });
            }
        };
        loadStore();
    }, [slug]);

     useEffect(() => {
    const alreadySaved = getSavedEmail();
    const dismissed = wasPopupDismissed();

    if (alreadySaved || dismissed) return;

    // show popup after 3 seconds if buyer has not saved email
    const timer = setTimeout(() => {
        setShowEmailPopup(true);
    }, 3000);

    // cleanup — if buyer leaves page before 3 seconds the timer cancels
    // this is important to prevent memory leaks in React
    return () => clearTimeout(timer);
}, [setShowEmailPopup]);


    // filter products when buyer selects a category tab
    const handleSelectCategory = (categoryId) => {
        if (categoryId === "all") {
            setFilteredProducts(products);
            return;
        }

        const filtered = products.filter((product) => {
                // handle both populated object and plain string
                const productCategoryId = typeof product.categoryId === "object" ? product.categoryId._id : product.categoryId;
                return productCategoryId === categoryId;
            });
        setFilteredProducts(filtered);
    };

    // loading state
    if (loading) {
        return(
            <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>Loading store...</p>
            </div>
        );
    }

    // error state - store not found or inactive
    if (error) {
        return(
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
            {/* navbar - sticky at top */}
            <Navbar store={store} />

            {/* hero banner - pro and premium only */}
            <HeroSection store={store} />

             {/*category tabs - horizontal scroll  */}
             <CategoryTabs categories={categories} onSelectCategory={handleSelectCategory} />

             {/* product grid */}
             <ProductGrid products={filteredProducts} slug={slug} />

             {/* footer */}
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