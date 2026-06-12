import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";

function ProductGrid ({ products, slug}) {
    if (products?.length === 0){
        return(
            <div className={styles.empty}>
                <p className={styles.emptyText}>No products found.</p>
            </div>
        );
    }

    return(
        <div className={styles.grid}>
            {products?.map((product) => (
                <ProductCard
                key={product._id}
                product={product}
                slug={slug}
                 />
            ))}
        </div>
    );
}

export default ProductGrid;