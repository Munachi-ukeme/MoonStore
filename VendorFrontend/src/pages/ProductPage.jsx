import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trackProductClick } from "../api/api";
import { getProduct, getStore, startConversation } from "../api/api";
import { getOrCreateSessionId } from "../utils/session";
import styles from "./ProductPage.module.css";
import Navbar from "../buyerComponent/Navbar";

function ProductPage() {
    const { slug, productSlug } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);

    const [store, setStore] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [selectedColor, setSelectedColor] = useState("");

    const [selectedSize, setSelectedSizze] = useState("");

    const [quantity, setQuantity] = useState(1);

    const [currentImage, setCurrentImage] = useState(0);

    const [copied, setCopied] = useState(false);

    const [deliveryAddress, setDeliveryAddress] = useState("");

    const [deliveryCity, setDeliveryCity] = useState("");

    const [deliveryPhone, setDeliveryPhone] = useState("");

    const [orderLoading, setOrderLoading] = useState(false);

    const [orderError, setOrderError] = useState(null);

    // fetch product and store data
    useEffect(() => {
        const loadData = async () =>{
            try {
                setLoading(true);

                const [storeData, productData] = await Promise.all([
                    getStore(slug),
                    getProduct(slug, productSlug),
                ]);

                if (storeData.error || productData.error) {
                    setError("Product not found.");
                    setLoading(false);
                    return;
                }

                setStore(storeData.store);
                setProduct(productData.product);
                setLoading(false);
            } catch(err) {
                setError("Something went wrong. Please try again.");
                setLoading(false);
            }
        };
        loadData();
    }, [slug, productSlug]);

    // OG tags - set dynamically so that different social media can read them
    useEffect(() =>{
        if (!product) return;

        document.title = `${product.name} - ${store?.businessName || "MoonStore"}`;

        const setMetaProperty = (property, content) => {
            let el = document.querySelector(`meta[property="${property}"]`);
            if(!el) {
                el = document.createElement("meta");
                el.setAttribute("property", property);
                document.head.appendChild(el);
            }
            el.setAttribute("content", content);
        };

        const setMetaName = (name, content) =>{
            let el = document.querySelector(`meta[name="${name}"]`);
            if (!el) {
                el = document.createElement("meta");
                el.setAttribute("name", name);
                document.head.appendChild(el);
            }
            el.setAttribute("content", content);
        };

        const description = product.description ? product.description : `₦${product.price.toLocaleString()}`;

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

    const handleIncrease = () =>{
        setQuantity((prev) => prev + 1);
    };

    const handleDecrease = () => {
        if (quantity > 1) {
            setQuantity((prev) => prev - 1);
        }
    };

    const handleColorSelect = (color) =>{
        if (color === selectedColor) {
            setSelectedColor("");
        } else {
            setSelectedColor(color)
        }
    };

    const handleSizeSelect = (size) => {
        if (size === selectedSize) {
            setSelectedSizze("");
        } else {
            setSelectedSizze(size);
        }
    };

    const handleCopyLink = () =>{
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOrderNow = async () => {
  if (!product.inStock) return;
  setOrderLoading(true);
  setOrderError(null);

  const sessionId = getOrCreateSessionId();

  // track the click
  await trackProductClick({
    sellerId: store._id,
    productId: product._id,
    sessionId,
  });

  const data = await startConversation(slug, productSlug, sessionId);
  setOrderLoading(false);

  if (data.error) {
    setOrderError("Could not start order. Please try again.");
    setTimeout(() => setOrderError(null), 3000);
    return;
  }

  navigate(`/${slug}/chat/${data.conversation._id}`);
};
    
     // loading state
    if (loading) {
        return (
            <div className={styles.centered}>
                <p className={styles.loadingText}>Loading product...</p>
            </div>
        );
    }

       // error state
    if (error || !product) {
        return (
            <div className={styles.centered}>
                <p className={styles.errorText}>{error || "Product not found."}</p>
                <button
                    className={styles.backBtnAlt}
                    onClick={() => navigate(`/${slug}`)}
                >
                    ← Back to Store
                </button>
            </div>
        );
    }

    const total = product.price * quantity;

    return (
        <div className={styles.page}>

            <Navbar store={store} />

            {/* back button */}
            <button
                className={styles.backBtn}
                onClick={() => navigate(`/${slug}`)}
            >
                ← Back to Store
            </button>

            <div className={styles.container}>

                {/* images section */}
                {product.images && product.images.length > 0 ? (
                    <div className={styles.imageSection}>
                        <img
                            src={product.images[currentImage]}
                            alt={product.name}
                            className={styles.mainImage}
                        /> 

                        {/* thumbnails — only show if more than one image */}
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

                {/* product info */}
                <div className={styles.info}>

                    {/* stock badge */}
                    {product.inStock ? (
                        <span className={styles.inStockBadge}>In Stock</span>
                    ) : (
                        <span className={styles.soldOutBadge}>Sold Out</span>
                    )}

                    <h1 className={styles.name}>{product.name}</h1>
                    <p className={styles.price}>
                        ₦{product.price.toLocaleString()}
                    </p>

                    {/* description */}
                    {product.description ? (
                        <p className={styles.description}>
                            {product.description}
                        </p>
                    ) : null}

                    {/* colors */}
                    {product.colors && product.colors.length > 0 ? (
                        <div className={styles.selectorSection}>
                            <p className={styles.selectorLabel}>Color</p>
                            <div className={styles.options}>
                                {product.colors.map((color) => (
                                    <button
                                        key={color}
                                        className={
                                            color === selectedColor
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
                            <div className={styles.options}>
                                {product.sizes.map((size) => (
                                    <button
                                        key={size}
                                        className={
                                            size === selectedSize
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
        </div>

                    {/* quantity */}
                    <div className={styles.selectorSection}>
                        <p className={styles.selectorLabel}>Quantity</p>
                        <div className={styles.quantityControl}>
                            <button
                                className={styles.qtyBtn}
                                onClick={handleDecrease}
                            >
                                −
                            </button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button
                                className={styles.qtyBtn}
                                onClick={handleIncrease}
                            >
                                +
                            </button>
                        </div>
                    </div>


                    {/* total */}
                    <p className={styles.total}>
                        Total: ₦{total.toLocaleString()}
                    </p>

                    {/* order now button */}
                        {orderError ? <p className={styles.orderError}>{orderError}</p> : null}

                    <button
                       className={styles.orderBtn}
                       onClick={handleOrderNow}
                       disabled={!product.inStock || orderLoading}
                    >
                    {orderLoading ? "Starting order..." : "Order Now"}
                    </button>
                    

                    {/* copy product link */}
                    <button
                        className={styles.copyBtn}
                        onClick={handleCopyLink}
                    >
                        {copied ? "✓ Link Copied!" : "Copy Product Link"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductPage;
