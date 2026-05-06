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
    };

}