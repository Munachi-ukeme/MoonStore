import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../api/api";
import styles from "./CategoryManager.module.css"

function CategoryManager (){
    const [categories, setCategories] = useState([]);

    const [input, setInput] = useState("");

    const [editingCategory, setEditingCategory] = useState(null);

    const [loading, setLoading] = useState(true);

    const [saveLoading, setSaveLoading] = useState(false);

    const [deleteLoading, setDeleteLoading] = useState(false);

    const [showDeleteWarning, setShowDeleteWarning] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState(null);

    const [error, setError] = useState(null);

    const [success, setSuccess] = useState(null);

    // fetch all categories when page loads 
    useEffect(() =>{
        const loadingCategories = async ()=>{
            setError(null);
            setLoading(true);
            const data = await getCategories();

            if (data.error) {
                setError(data.error);
                setLoading(false);
                return;
            }

            // make sure data is an array
            if(Array.isArray(data)){
                setCategories(data);
            } else{
                setCategories([]);
            }

            setLoading(false);
        };

        loadingCategories();
    }, []);

    // seller clicks edit on a category
    const handleEditClick = (category) =>{
        setEditingCategory(category);
        setInput(category.name);
        setError(null);
        setSuccess(null);
    };

    // seller clicks cancel while editing
    const handleCancel = ()=>{
        setEditingCategory(null);
        setInput("")
        setError(null);
    };


    // seller clicks add or update button
const handleSave = async () => {
  setError(null);
  setSuccess(null);
  
  const trimmed = input.trim();
  if (!trimmed) {
    setError("Category name cannot be empty.");
    return;
  }

  setSaveLoading(true);

  if (editingCategory) {
    // UPDATE EXISTING CATEGORY
    const data = await updateCategory(editingCategory._id, trimmed);
    setSaveLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    const currentCategories = Array.isArray(categories) ? categories : [];
    setCategories(
      currentCategories.map((cat) =>
        cat._id === editingCategory._id ? data : cat
      )
    );
    setEditingCategory(null);
    setInput("");
    setSuccess("Category updated successfully.");

  } else {
    // ADD NEW CATEGORY
    const data = await createCategory(trimmed);
    setSaveLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    const currentCategories = Array.isArray(categories) ? categories : [];
    setCategories([data, ...currentCategories]);
    setInput("");
    setSuccess("Category added successfully.");
  }
};

    // seller clicks Delete on a category
    const handleDeleteClick = (category) =>{
        setSelectedCategory(category);
        setShowDeleteWarning(true);
    };

    // seller confirms delete in the popup
    const handleConfirmDelete = async () =>{
        setDeleteLoading(true);
        const data = await deleteCategory(selectedCategory._id);
        setDeleteLoading(false);

        if (data.error) {
            setError(data.error);
            setShowDeleteWarning(false);
            return;
        }

        // remove deleted category from the list
        setCategories(categories.filter((cat) => cat._id !== selectedCategory._id));
        setShowDeleteWarning(false);
        setSelectedCategory(null)
        setSuccess("Category deleted successfully")
    };

    // seller cancels delete popup
    const handleCancelDelete = () =>{
        setShowDeleteWarning(false);
        setSelectedCategory(null);
    };

    return(
        <div className={styles.container}>
            {/* success message */}
            {success && <p className={styles.success}>{success}</p>}

            {/* error message */}
            {error && <p className={styles.error}>{error}</p>}

            {/* input and add/update button */}
            <div className={styles.inputRow}>
                <input 
                type="text"
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g Dresses"
                onKeyDown={(e) =>{
                    if(e.key === "Enter"){
                        handleSave();
                    }
                }}
                />

                <button
                className={styles.addButton}
                onClick={handleSave}
                disabled={saveLoading}
                >
                    {saveLoading ? "Saving..." : editingCategory ? "Update" : "Add"}
                </button>

                {/* cancel button only shows when editing */}
                {editingCategory ? (
                    <button
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    >
                        Cancel
                    </button>
                ) : null}

            </div>

            {/*  loading state*/}
            {loading ? (
                <p className={styles.loading}>
                    Loading categories...
                </p>
            ) : null}

            {/* empty state */}
            {loading ? null : categories.length === 0 ? (
                <p className={styles.empty}>You have not added any category yet.</p>
            ) : null}

            {/* categories list */}
            {loading ? null : categories.length > 0 ? (
                <div className={styles.list}>
                    {categories.map((cat) => (
                        <div key={cat._id} className={styles.categoryRow}>
                            <p className={styles.categoryName}>{cat.name}</p>

                            <div className={styles.actions}>
                                <button
                                className={styles.editButton}
                                onClick={() => handleEditClick(cat)}
                                >
                                    Edit
                                </button>

                                <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteClick(cat)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}                    
                </div>
            ): null}

            {/* delete warning popup */}
            {showDeleteWarning ? (
                <div className={styles.overlay}>
                    <div className={styles.popup}>
                        <h3 className={styles.popupTitle}>Delete Category?</h3>
                        <p className={styles.popupText}>
                            You are about to delete{" "}
                            <strong>{selectedCategory?.name}</strong>. This cannot be undone.
                        </p>

                        <div className={styles.popupButtons}>
                            <button
                            className={styles.cancelPopupButton}
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

export default CategoryManager;