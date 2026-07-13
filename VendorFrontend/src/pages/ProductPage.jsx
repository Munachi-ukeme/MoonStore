import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trackProductClick, getProduct, getStore } from "../api/api";
import { getOrCreateSessionId } from "../utils/session";
import styles from "./ProductPage.module.css";
import Navbar from "../buyerComponent/Navbar";

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
    

    // delivery fields
    const [buyerName, setBuyerName] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryCity, setDeliveryCity] = useState("");
    const [deliveryPhone, setDeliveryPhone] = useState("");
    const [addressAlreadySaved, setAddressAlreadySaved] = useState(false);
    const [showChangeAddress, setShowChangeAddress] = useState(false);

    const [addedToTray, setAddedToTray] = useState(false);

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

            // check if tray already has address saved
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

        const description = product.description || `₦${product.price.toLocaleString()}`;
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

            // save address only if not already saved
            if (!tray.deliveryAddress && deliveryAddress) {
                tray.deliveryAddress = deliveryAddress;
                tray.deliveryCity = deliveryCity;
                tray.deliveryPhone = deliveryPhone;
                tray.buyerName = buyerName;
            }

            // add item to tray
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

            // track product click
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
            // localStorage failed — still navigate back
            navigate(`/${slug}`);
        }
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

    const total = product.price * quantity;

    return (
        <div className={styles.page}>
            <Navbar store={store} />

            <button className={styles.backBtn} onClick={() => navigate(`/${slug}`)}>
                ← Back to Store
            </button>

            <div className={styles.container}>

                {/* images */}
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
                    <p className={styles.price}>₦{product.price.toLocaleString()}</p>

                    {product.description ? (
                        <p className={styles.description}>{product.description}</p>
                    ) : null}

                    {/* colors */}
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

                    {/* sizes */}
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

                    {/* delivery section */}
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

                    {/* quantity */}
                    <div className={styles.selectorSection}>
                        <p className={styles.selectorLabel}>Quantity</p>
                        <div className={styles.quantityControl}>
                            <button className={styles.qtyBtn} onClick={handleDecrease}>−</button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button className={styles.qtyBtn} onClick={handleIncrease}>+</button>
                        </div>
                    </div>

                    <p className={styles.total}>Total: ₦{total.toLocaleString()}</p>

                    {/* add to order button */}
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
        </div>
    );
};

export default ProductPage;