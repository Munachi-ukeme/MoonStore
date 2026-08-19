import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trackProductClick, getProduct, getStore, getReviewEligibility, submitReview, getProductReviews } from "../api/api";
import { getOrCreateSessionId, getSavedEmail, saveBuyerEmailLocally } from "../utils/session";
import styles from "./ProductPage.module.css";
import Navbar from "../buyerComponent/Navbar";
import { grossUpPrice } from "../utils/pricing";

const TRAY_KEY = (slug) => `moonstore_order_${slug}`;

const ProductPage = () => {
    const { slug, productSlug } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [currentImage, setCurrentImage] = useState(0);
    const [copied, setCopied] = useState(false);

    const [buyerName, setBuyerName] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryCity, setDeliveryCity] = useState("");
    const [deliveryPhone, setDeliveryPhone] = useState("");
    const [addressAlreadySaved, setAddressAlreadySaved] = useState(false);
    const [showChangeAddress, setShowChangeAddress] = useState(false);

    const [addedToTray, setAddedToTray] = useState(false);

    // ─── review state ───
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [eligible, setEligible] = useState(false);
    const [hasNoSavedEmail, setHasNoSavedEmail] = useState(false);
    const [buyerEmailInput, setBuyerEmailInput] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [reviewError, setReviewError] = useState("");

    const loadData = async () => {
        setError(null);
        setLoading(true);
        try {
            const [storeData, productData] = await Promise.all([
                getStore(slug),
                getProduct(slug, productSlug),
            ]);
            if (storeData.error || productData.error) {
                setError(storeData.error || productData.error || "Product not found.");
                setLoading(false);
                return;
            }
            setStore(storeData.store);
            setProduct(productData.product);

            try {
                const existing = localStorage.getItem(TRAY_KEY(slug));
                if (existing) {
                    const tray = JSON.parse(existing);
                    if (tray.deliveryAddress) {
                        setDeliveryAddress(tray.deliveryAddress);
                        setDeliveryCity(tray.deliveryCity || "");
                        setDeliveryPhone(tray.deliveryPhone || "");
                        setBuyerName(tray.buyerName || "");
                        setAddressAlreadySaved(true);
                    }
                }
            } catch {
                // ignore
            }

            setLoading(false);
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [slug, productSlug]);

    // ─── load reviews + check eligibility once product is loaded ───
    const loadReviews = async () => {
        if (!product?._id) return;

        const reviewData = await getProductReviews(product._id);
        if (!reviewData.error) {
            setReviews(reviewData.reviews);
            setAverageRating(reviewData.averageRating);
            setTotalReviews(reviewData.totalReviews);
        }

        const savedEmail = getSavedEmail();
        if (!savedEmail) {
            setHasNoSavedEmail(true);
            return;
        }

        const eligibilityData = await getReviewEligibility(product._id, savedEmail);
        if (eligibilityData.eligible) {
            setEligible(true);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [product]);

    useEffect(() => {
        if (!product) return;
        document.title = `${product.name} - ${store?.businessName || "MoonStore"}`;

        const setMetaProperty = (property, content) => {
            let el = document.querySelector(`meta[property="${property}"]`);
            if (!el) {
                el = document.createElement("meta");
                el.setAttribute("property", property);
                document.head.appendChild(el);
            }
            el.setAttribute("content", content);
        };

        const setMetaName = (name, content) => {
            let el = document.querySelector(`meta[name="${name}"]`);
            if (!el) {
                el = document.createElement("meta");
                el.setAttribute("name", name);
                document.head.appendChild(el);
            }
            el.setAttribute("content", content);
        };

        const description = product.description || `₦${grossUpPrice(product.price).toLocaleString()}`;
        const image = product.images && product.images.length > 0 ? product.images[0] : "";

        setMetaProperty("og:title", product.name);
        setMetaProperty("og:description", description);
        setMetaProperty("og:image", image);
        setMetaProperty("og:url", window.location.href);
        setMetaProperty("og:type", "product");
        setMetaName("twitter:card", "summary_large_image");
        setMetaName("twitter:title", product.name);
        setMetaName("twitter:description", description);
        setMetaName("twitter:image", image);
    }, [product, store]);

    const handleIncrease = () => setQuantity((prev) => prev + 1);

    const handleDecrease = () => {
        if (quantity > 1) setQuantity((prev) => prev - 1);
    };

    const handleColorSelect = (color) => {
        if (selectedColors.includes(color)) {
            setSelectedColors(selectedColors.filter((c) => c !== color));
        } else {
            setSelectedColors([...selectedColors, color]);
        }
    };

    const handleSizeSelect = (size) => {
        if (selectedSizes.includes(size)) {
            setSelectedSizes(selectedSizes.filter((s) => s !== size));
        } else {
            setSelectedSizes([...selectedSizes, size]);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddToOrder = () => {
        if (!product.inStock) return;

        try {
            const existing = localStorage.getItem(TRAY_KEY(slug));
            const tray = existing ? JSON.parse(existing) : {
                slug,
                items: [],
                buyerName: "",
                deliveryAddress: "",
                deliveryCity: "",
                deliveryPhone: "",
            };

            if (!tray.deliveryAddress && deliveryAddress) {
                tray.deliveryAddress = deliveryAddress;
                tray.deliveryCity = deliveryCity;
                tray.deliveryPhone = deliveryPhone;
                tray.buyerName = buyerName;
            }

            tray.items.push({
                productSlug: product.slug,
                productName: product.name,
                price: product.price,
                quantity,
                colors: selectedColors.length > 0 ? selectedColors : null,
                sizes: selectedSizes.length > 0 ? selectedSizes : null,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
            });

            localStorage.setItem(TRAY_KEY(slug), JSON.stringify(tray));

            trackProductClick({
                sellerId: store._id,
                productId: product._id,
                sessionId: getOrCreateSessionId(),
            });

            setAddedToTray(true);
            setTimeout(() => {
                navigate(`/${slug}`);
            }, 600);
        } catch {
            navigate(`/${slug}`);
        }
    };

    // ─── review handlers ───
    const maskEmail = (email) => {
        const [name, domain] = email.split("@");
        const masked = name.length > 2
            ? name[0] + "*".repeat(name.length - 2) + name[name.length - 1]
            : name[0] + "*";
        return `${masked}@${domain}`;
    };

    const handleCheckEligibilityWithEmail = async () => {
        if (!buyerEmailInput.trim() || !buyerEmailInput.includes("@")) {
            setReviewError("Please enter a valid email.");
            return;
        }

        setReviewError("");
        const email = buyerEmailInput.trim();

        saveBuyerEmailLocally(email);

        const eligibilityData = await getReviewEligibility(product._id, email);
        if (eligibilityData.eligible) {
            setEligible(true);
            setHasNoSavedEmail(false);
        } else {
            setReviewError(
                eligibilityData.reason === "not_purchased"
                    ? "We couldn't find a purchase of this product with that email."
                    : eligibilityData.reason === "too_soon"
                        ? "Your review will be available 24 hours after payment."
                        : eligibilityData.reason === "already_reviewed"
                            ? "You've already reviewed this product."
                            : "Could not verify your purchase."
            );
        }
    };

    const handleSubmitReview = async () => {
        if (reviewRating < 1) {
            setReviewError("Please select a star rating.");
            return;
        }

        const buyerEmail = getSavedEmail() || buyerEmailInput.trim();
        if (!buyerEmail) {
            setReviewError("Please enter your email first.");
            return;
        }

        setReviewSubmitting(true);
        setReviewError("");

        const data = await submitReview(store._id, product._id, buyerEmail, reviewRating, reviewText);

        setReviewSubmitting(false);

        if (data.error) {
            setReviewError(data.error);
            return;
        }

        setReviewSubmitted(true);
        setEligible(false);
        loadReviews();
    };

    if (loading) {
        return (
            <div className={styles.centered}>
                <p className={styles.loadingText}>Loading product...</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className={styles.centered}>
                <p className={styles.errorText}>{error || "Product not found."}</p>
                <button className={styles.retryBtn} onClick={loadData}>
                    Try Again
                </button>
                <button className={styles.backBtnAlt} onClick={() => navigate(`/${slug}`)}>
                    ← Back to Store
                </button>
            </div>
        );
    }

    const buyerUnitPrice = grossUpPrice(product.price);
    const total = buyerUnitPrice * quantity;

    return (
        <div className={styles.page}>
            <Navbar store={store} />

            <button className={styles.backBtn} onClick={() => navigate(`/${slug}`)}>
                ← Back to Store
            </button>

            <div className={styles.container}>

                {product.images && product.images.length > 0 ? (
                    <div className={styles.imageSection}>
                        <img
                            src={product.images[currentImage]}
                            alt={product.name}
                            className={styles.mainImage}
                        />
                        {product.images.length > 1 ? (
                            <div className={styles.thumbnails}>
                                {product.images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt={`${product.name} view ${i + 1}`}
                                        className={
                                            i === currentImage
                                                ? `${styles.thumb} ${styles.activeThumb}`
                                                : styles.thumb
                                        }
                                        onClick={() => setCurrentImage(i)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className={styles.noImage}>
                        <p>No image available</p>
                    </div>
                )}

                <div className={styles.info}>
                    {product.inStock ? (
                        <span className={styles.inStockBadge}>In Stock</span>
                    ) : (
                        <span className={styles.soldOutBadge}>Sold Out</span>
                    )}

                    <h1 className={styles.name}>{product.name}</h1>
                    <p className={styles.price}>₦{buyerUnitPrice.toLocaleString()}</p>

                    {/* ─── reviews section ─── */}
            <div className={styles.reviewsSection}>
                <div className={styles.reviewsHeader}>
                    <p className={styles.reviewsTitle}>
                        {totalReviews > 0
                            ? `★ ${averageRating.toFixed(1)} · ${totalReviews} review${totalReviews === 1 ? "" : "s"}`
                            : "No reviews yet"}
                    </p>
                </div>

                    {product.description ? (
                        <p className={styles.description}>{product.description}</p>
                    ) : null}

                    {product.colors && product.colors.length > 0 ? (
                        <div className={styles.selectorSection}>
                            <p className={styles.selectorLabel}>Color</p>
                            <p className={styles.deliveryHint}>You can pick more than one colors</p>
                            <div className={styles.options}>
                                {product.colors.map((color) => (
                                    <button
                                        key={color}
                                        className={
                                            selectedColors.includes(color)
                                                ? `${styles.optionBtn} ${styles.activeOption}`
                                                : styles.optionBtn
                                        }
                                        onClick={() => handleColorSelect(color)}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {product.sizes && product.sizes.length > 0 ? (
                        <div className={styles.selectorSection}>
                            <p className={styles.selectorLabel}>Size</p>
                            <p className={styles.deliveryHint}>You can pick more than one sizes</p>
                            <div className={styles.options}>
                                {product.sizes.map((size) => (
                                    <button
                                        key={size}
                                        className={
                                            selectedSizes.includes(size)
                                                ? `${styles.optionBtn} ${styles.activeOption}`
                                                : styles.optionBtn
                                        }
                                        onClick={() => handleSizeSelect(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className={styles.deliverySection}>
                        <p className={styles.selectorLabel}>Delivery Details</p>
                        <p className={styles.deliveryHint}>Optional — fill in if you want delivery</p>

                        {addressAlreadySaved && !showChangeAddress ? (
                            <div className={styles.savedAddress}>
                                <p className={styles.savedAddressText}>
                                    📦 {deliveryAddress}{deliveryCity ? `, ${deliveryCity}` : ""}
                                </p>
                                {deliveryPhone ? (
                                    <p className={styles.savedAddressText}>📞 {deliveryPhone}</p>
                                ) : null}
                                {buyerName ? (
                                    <p className={styles.savedAddressText}>👤 {buyerName}</p>
                                ) : null}
                                <button
                                    className={styles.changeAddressBtn}
                                    onClick={() => setShowChangeAddress(true)}
                                >
                                    Change address
                                </button>
                            </div>
                        ) : (
                            <>
                                <input
                                    className={styles.deliveryInput}
                                    type="text"
                                    placeholder="Your name"
                                    value={buyerName}
                                    onChange={(e) => setBuyerName(e.target.value)}
                                />
                                <input
                                    className={styles.deliveryInput}
                                    type="text"
                                    placeholder="Delivery address"
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                />
                                <input
                                    className={styles.deliveryInput}
                                    type="text"
                                    placeholder="City"
                                    value={deliveryCity}
                                    onChange={(e) => setDeliveryCity(e.target.value)}
                                />
                                <input
                                    className={styles.deliveryInput}
                                    type="tel"
                                    placeholder="Phone number for delivery"
                                    value={deliveryPhone}
                                    onChange={(e) => setDeliveryPhone(e.target.value)}
                                />
                            </>
                        )}
                    </div>

                    <div className={styles.selectorSection}>
                        <p className={styles.selectorLabel}>Quantity</p>
                        <div className={styles.quantityControl}>
                            <button className={styles.qtyBtn} onClick={handleDecrease}>−</button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button className={styles.qtyBtn} onClick={handleIncrease}>+</button>
                        </div>
                    </div>

                    <p className={styles.total}>Total: ₦{total.toLocaleString()}</p>

                    <button
                        className={addedToTray ? `${styles.orderBtn} ${styles.addedBtn}` : styles.orderBtn}
                        onClick={handleAddToOrder}
                        disabled={!product.inStock || addedToTray}
                    >
                        {addedToTray ? "✓ Added!" : "Add to Cart"}
                    </button>

                    <button className={styles.copyBtn} onClick={handleCopyLink}>
                        {copied ? "✓ Link Copied!" : "Copy Product Link"}
                    </button>
                </div>
            </div>

            

                {hasNoSavedEmail && !eligible && !reviewSubmitted ? (
                    <div className={styles.reviewEmailCheck}>
                        <p className={styles.reviewFormLabel}>Bought this product? Enter your email to leave a review</p>
                        <input
                            type="email"
                            className={styles.reviewEmailInput}
                            placeholder="Your email"
                            value={buyerEmailInput}
                            onChange={(e) => setBuyerEmailInput(e.target.value)}
                        />
                        {reviewError ? <p className={styles.reviewError}>{reviewError}</p> : null}
                        <button className={styles.reviewCheckBtn} onClick={handleCheckEligibilityWithEmail}>
                            Check
                        </button>
                    </div>
                ) : null}

                {eligible && !reviewSubmitted ? (
                    <div className={styles.reviewForm}>
                        <p className={styles.reviewFormLabel}>Leave a review</p>
                        <div className={styles.starPicker}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={star <= reviewRating ? styles.starActive : styles.starInactive}
                                    onClick={() => setReviewRating(star)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <textarea
                            className={styles.reviewTextarea}
                            placeholder="Share your experience with this product (optional)"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={3}
                        />
                        {reviewError ? <p className={styles.reviewError}>{reviewError}</p> : null}
                        <button
                            className={styles.reviewSubmitBtn}
                            onClick={handleSubmitReview}
                            disabled={reviewSubmitting}
                        >
                            {reviewSubmitting ? "Submitting..." : "Submit Review"}
                        </button>
                    </div>
                ) : null}

                {reviewSubmitted ? (
                    <p className={styles.reviewThanks}>Thank you for your review!</p>
                ) : null}

                <div className={styles.reviewsList}>
                    {reviews.map((review) => (
                        <div key={review._id} className={styles.reviewItem}>
                            <p className={styles.reviewItemStars}>
                                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                            </p>
                            {review.text ? <p className={styles.reviewItemText}>{review.text}</p> : null}
                            <p className={styles.reviewItemMeta}>
                                {maskEmail(review.buyerEmail)} · {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductPage;