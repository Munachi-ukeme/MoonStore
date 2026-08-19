import { useState } from "react";
import { useNavigate} from "react-router-dom";
import styles from "./ProductCard.module.css";
import { grossUpPrice } from "../utils/pricing";

function ProductCard({ product, slug}){
    const navigate = useNavigate();
    const [showOutOfStock, setShowOutOfStock] = useState(false);

    const hasStockTracking = product.stockCount !== undefined && product.stockCount !== null;
    const showLowStockText = hasStockTracking && product.inStock && product.stockCount <= 5;

    const handleClick = () => {
        if (!product.inStock){
            setShowOutOfStock(true);
            setTimeout(() => setShowOutOfStock(false), 2000);
            return;
        }
        navigate(`/${slug}/${product.slug}`);
    };

    return(
        <>
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                {product.images && product.images[0] ? (
                    <img
                    src={product.images[0]}
                    alt={product.name}
                    className={styles.image}
                    />
                ) : (
                    <div className={styles.noImage}>No Image</div>
                )}

                <div className={
                    product.inStock ? styles.inStockBadge : styles.soldOutBadge
                }>
                    {product.inStock ? "In Stock" : "Sold Out"}
                </div>
            </div>

            <div className={styles.info}>
                <p className={styles.name}>{product.name}</p>
                <p className={styles.price}>
                    ₦{grossUpPrice(product.price).toLocaleString()}
                </p>

                {showLowStockText ? (
                    <p className={styles.lowStockText}>
                        Only {product.stockCount} left
                    </p>
                ) : null}

                <button
                className={
                    product.inStock ? styles.viewButton : styles.viewButtonDisabled
                }
                onClick={handleClick}
                >
                    View Product
                </button>
            </div>
        </div>

        {showOutOfStock ? (
            <div className={styles.outOfStockPopup}>
            <p className={styles.outOfStockText}> Out of stock. Check back later</p>
            </div>
        ) : null}
        </>
    );
}

export default ProductCard;