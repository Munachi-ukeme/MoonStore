import { useState } from "react";
import { deleteProduct, updateProduct} from "../api/api";
import styles from "./ProductTable.module.css";

function ProductTable({ products, categories, onEdit, onDeleted, onStockToggle}) {
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState(null);

    //truncate description to 50 characters
    const truncateDescription = (text) =>{
        if (!text) {
            return "No description"
        }

        if (text.length > 50) {
            return text.substring(0, 50) + "...";
        }
        return text;
    };

    //find category name by id
    const getCategoryName = (categoryId) =>{
        const category = categories.find((cat) => cat._id === categoryId);
        if (category) {
            return category.name;
        }
        return "Uncategorized";
    };

    const handleDeleteClick = (product) =>{
        setSelectedProduct(product);
        setShowDeleteWarning(true)
    };

    const handleConfirmDelete = async() =>{
        setDeleteLoading(true);
        setError(null);
        const data = await deleteProduct(selectedProduct._id);
        setDeleteLoading(false);

        if (data.error) {
            setError(data.error)
            setShowDeleteWarning(false)
            return;
        }

        setShowDeleteWarning(false);
        setSelectedProduct(null);
        onDeleted(selectedProduct._id);
    };

    const handleCancelDelete = () =>{
        setShowDeleteWarning(false);
        setSelectedProduct(null);
    };

    const handleStockToggle = async(product) =>{
        const formData = new FormData();
        formData.append("inStock", !product.inStock);

        const data = await updateProduct(product._id, formData);

        if(data.error) {
            setError(data.error);
            return;
        }

        onStockToggle(product._id, !product.inStock);
    }

    return(
        <div className={styles.container}>
            {/* error message */}
            {error && <p className={styles.error}>{error}</p>}

            {/* empty state */}
            {products.length === 0 ? (
                <p className={styles.empty}>You have not added any product yet.</p>
            ) : null}

            {/* product list */}
            {products.length > 0 ?(
                <div className={styles.table}>
                    {/* table header */}
                    <div className={styles.tableHeader}>
                        <span>Product</span>
                        <span>Price</span>
                        <span>Category</span>
                        <span>Description</span>
                        <span>Stock</span>
                        <span>Actions</span>
                    </div>

                    {/* table rows */}
                    {products.map((product) =>(
                        <div key={product._id} className={styles.tableRow}>

                            {/* product name + image */}
                            <div className={styles.productName}>
                                {product.images && product.images[0] ? (
                                    <img
                                    src={product.images[0]} 
                                    alt={product.name}
                                    className={styles.productImage}
                                     />
                                ) : null}
                                <span>{product.name}</span>
                            </div>

                            {/* price */}
                            <span className={styles.price}>
                                ₦{product.price.toLocaleString()}
                            </span>

                            {/* category */}
                            <span className={styles.category}>
                                {getCategoryName(product.categoryId)}
                            </span>

                            {/* description truncated */}
                            <span className={styles.description}>
                                {truncateDescription(product.description)}
                            </span>

                            {/* stock status toggle */}
                            <button
                            className={product.inStock ? styles.inStock : styles.soldOut}
                            onClick={() => handleStockToggle(product)}
                            >
                                {product.inStock ? "In Stock" : "Sold Out"}
                            </button>

                            {/* action */}
                            <div className={styles.actions}>
                                <button
                                className={styles.editButton}
                                onClick={() => onEdit(product)}
                                >
                                    Edit
                                </button>

                                <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteClick (product)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* delete warning popup */}
            {showDeleteWarning ? (
                <div className={styles.overlay}>
                    <div className={styles.popup}>
                        <h3 className={styles.popupTitle}>Delete Product</h3>
                        <p className={styles.popupText}>
                            You are about to delete{" "}
                            <strong>{selectedProduct?.name}</strong>. This cannot be undone
                        </p>

                        <div className={styles.popupButtons}>
                            <button
                            className={styles.cancelButton}
                            onClick={handleCancelDelete}
                            >
                                Cancel
                            </button>

                            <button
                            className={styles.confirmDeleteButton}
                            onClick={handleConfirmDelete}
                            disabled={deleteLoading}
                            >
                                {deleteLoading ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );

}

export default ProductTable;