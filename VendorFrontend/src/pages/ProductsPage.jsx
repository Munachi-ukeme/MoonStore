import {useState, useEffect} from "react";
import { getProduct, getCategories, getProducts } from "../api/api";
import ProductForm from "../sellerComponent/ProductForm";
import ProductTable from "../sellerComponent/ProductTable";
import styles from "./ProductsPage.module.css";

function ProductsPage (){
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState (false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //fetch all products when page loads
    useEffect(() =>{
        const loadData = async () =>{
            setError(null);
            setLoading(true);
            const [productsData, categoriesData] = await Promise.all([
                getProducts(),
                getCategories(),
            ]);

            if (productsData.error){
                setError(productsData.error);
                setLoading(false);
                return;
            }

            setProducts(productsData);
            setCategories(categoriesData || []);
            setLoading(false);
        };
        loadData();  
    }, []);


    // seller clicks Add product button
    const handleAddClick =()=>{
        setEditingProduct(null);
        setShowForm(true);
    };

    //seller clicks Edit on a product in the table
    const handleEditClick = (product) =>{
        setEditingProduct(product);
        setShowForm(true);
    };

    //seller clicks cancel inside productform
    const handleCancel = ()=>{
        setEditingProduct(null);
        setShowForm(false);
    }

    //seller saves successfully inside productform
    const handleSaved = (savedProduct) =>{
        if(editingProduct) {
            // replace the old product with the updated one in the list
            setProducts(products.map((p) =>{
                if (p._id === savedProduct._id){
                    return savedProduct;
                }
                return p;
            }));
        } else {
            // add the new product to the top  of the list
            setProducts([savedProduct, ...products]);
        }

        setEditingProduct(null);
        setShowForm(false);
    };

    // seller deletes a product from the table
    const handleDeleted = (deleteId) =>{
        setProducts(products.filter((p) => p._id !== deleteId));
    };

    // seller toggles stock status from the table
    const handleStockToggle = (productId, newStockStatus) =>{
        setProducts(products.map((p) =>{
            if (p._id === productId){
                return { ...p, inStock: newStockStatus};
            }
            return p;
        }));
    };

    return(
        <div className={styles.container}>
            {/* page header */}
            <div className={styles.header}>
                

                {/* only show Add product button when form is hidden */}
                {showForm ? null : (
                    <button
                    className={styles.addButton}
                    onClick={handleAddClick}
                    >
                        Add Product
                    </button>
                )}
            </div>

            {error ? (
            <div className={styles.errorRow}>
            <p className={styles.error}>{error}</p>
            <button className={styles.retryBtn} onClick={loadProducts}>
             Try Again
            </button>
            </div>
            ) : null}

            {/* loading state */}
            {loading ? (
                <p className={styles.loading}>Loading products...</p>
            ) : null}

            {/* product form - only shows when seller clicks Add or edit */}
            {showForm ? (
                <ProductForm
                editingProduct={editingProduct} 
                onSaved={handleSaved}
                onCancel={handleCancel}
                />
            ) : null}

            {/* product table - always visible when not loading */}
            {loading ? null : (
                <ProductTable 
                products={products}
                categories={categories}
                onEdit={handleEditClick}
                onDeleted={handleDeleted}
                onStockToggle={handleStockToggle}
                />
            )}
        </div>
    );
}

export default ProductsPage;