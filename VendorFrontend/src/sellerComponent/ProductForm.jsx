import { useState, useEffect } from "react";
import { createProduct, updateProduct, getCategories } from "../api/api";
import imageCompression from "browser-image-compression";
import styles from "./ProductForm.module.css";
import { grossUpPrice } from "../utils/pricing";

const ProductForm = ({ editingProduct, onSaved, onCancel }) => {
    const maxImages = 5;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [images, setImages] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [colorInput, setColorInput] = useState("");
    const [sizeInput, setSizeInput] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [originalPrice, setOriginalPrice] = useState("");
    const [displayPrice, setDisplayPrice] = useState(null);

    // load categories for the dropdown
    useEffect(() => {
        const loadCategories = async () => {
            const data = await getCategories();
            if (!data.error) {
                setCategories(data);
            }
        };
        loadCategories();
    }, []);

    // if editing, fill the form with existing product data
    useEffect(() => {
        if (editingProduct) {
            setName(editingProduct.name || "");
            setOriginalPrice(editingProduct.price || "");
            setDescription(editingProduct.description || "");
          setCategoryId(editingProduct.categoryId?._id || editingProduct.categoryId || "");
            setColors(editingProduct.colors || []);
            setSizes(editingProduct.sizes || []);

            if (editingProduct.price) {
                setDisplayPrice(grossUpPrice(Number(editingProduct.price)));
            } else {
                setDisplayPrice(null);
            }
        } else {
            // reset form when adding new product
            setName("");
            setOriginalPrice("");
            setDisplayPrice(null);
            setDescription("");
            setCategoryId("");
            setImages([]);
            setColors([]);
            setSizes([]);
        }
    }, [editingProduct]);

    // add a color tag
    const handleAddColor = () => {
        const trimmed = colorInput.trim();
        if (!trimmed || colors.includes(trimmed)) return;

        setColors([...colors, trimmed]);
        setColorInput("");
    };

    // remove a color tag
    const handleRemoveColor = (colorToRemove) => {
        setColors(colors.filter((color) => color !== colorToRemove));
    };

    // add a size tag
    const handleAddSize = () => {
        const trimmed = sizeInput.trim();
        if (!trimmed || sizes.includes(trimmed)) return;

        setSizes([...sizes, trimmed]);
        setSizeInput("");
    };

    // remove a size tag
    const handleRemoveSize = (sizeToRemove) => {
        setSizes(sizes.filter((size) => size !== sizeToRemove));
    };

    // handle image file selection
    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const totalImageCount = images.length + selectedFiles.length;

        if (totalImageCount > maxImages) {
            setError(`You can only upload a maximum of ${maxImages} images per product.`);
            e.target.value = null; // Clear input element safely
            return;
        }
        setError(null);
        setImages([...images, ...selectedFiles]);
    };

    // remove a staged file from state before uploading
    const handleRemoveStagedImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault(); // Guard against unintended page refreshes
        setError(null);

        // basic validation
        if (!name) {
            setError("Product name is required.");
            return;
        }

        if (!originalPrice) {
            setError("Price is required.");
            return;
        }

        if (!categoryId) {
            setError("Please select a category.");
            return;
        }

        if (!editingProduct && images.length === 0) {
            setError("Please upload at least one image.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("price", originalPrice);
        formData.append("description", description);
        formData.append("categoryId", categoryId);
        formData.append("colors", JSON.stringify(colors));
        formData.append("sizes", JSON.stringify(sizes));

        if (images.length > 0) {
            const compressionOptions = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
                initialQuality: 0.85
            };

            try {
                // Loop through each selected image, compress it, and append it
                for (let i = 0; i < images.length; i++) {
                    const originalImage = images[i];

                    if (originalImage.size > 400 * 1024) {
                        const compressedFile = await imageCompression(originalImage, compressionOptions);
                        formData.append("images", compressedFile, originalImage.name);
                    } else {
                        formData.append("images", originalImage);
                    }
                }
            } catch (err) {
                console.error("Compression subsystem failure:", err);
                setError("Failed to optimize images for upload. Please try again.");
                setLoading(false);
                return;
            }
        }

        let data;
        if (editingProduct) {
            data = await updateProduct(editingProduct._id, formData);
        } else {
            data = await createProduct(formData);
        }

        setLoading(false);

        if (data.error) {
            setError(data.error);
            return;
        }

        onSaved(data);
    };

    const handlePriceChange = (e) => {
        const val = e.target.value;
        setOriginalPrice(val);
        if (val && !isNaN(val) && Number(val) > 0) {
            setDisplayPrice(grossUpPrice(Number(val)));
        } else {
            setDisplayPrice(null);
        }
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>
                {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>

            {error && <p className={styles.error}>{error}</p>}

            {/* product name */}
            <div className={styles.field}>
                <label className={styles.label}>Product Name</label>
                <input
                    type="text"
                    value={name}
                    className={styles.input}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g Ankara Gown"
                />
            </div>

            {/* price */}
            <div className={styles.field}>
                <label className={styles.label}>Price (₦)</label>
                <input
                    type="number"
                    value={originalPrice}
                    className={styles.input}
                    onChange={handlePriceChange}
                    placeholder="e.g 15,000.00"
                />
                {displayPrice ? (
                    <p className={styles.priceNote}>
                        Buyer will pay <strong>₦{displayPrice.toLocaleString()}</strong> (₦{(displayPrice - Number(originalPrice)).toLocaleString()} includes Paystack gateway processing fee).
                    </p>
                ) : null}
            </div>

            {/* description */}
            <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                    value={description}
                    className={styles.textarea}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your product..."
                    rows={4}
                />
            </div>

            {/* category dropdown */}
            <div className={styles.field}>
                <label className={styles.label}>Category</label>
                <select
                    value={categoryId}
                    className={styles.select}
                    onChange={(e) => setCategoryId(e.target.value)}
                >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* images */}
            <div className={styles.field}>
                <label className={styles.label}>Images (max {maxImages})</label>
                <input
                    type="file"
                    accept="image/*"
                    className={styles.input}
                    onChange={handleImageChange}
                    multiple
                    disabled={images.length >= maxImages}
                />
                <p className={styles.hint}>
                    Maximum of {maxImages} images per product
                </p>

                {/* Staged new files display panel */}
                {images.length > 0 && (
                    <div className={styles.stagedImages}>
                        <p className={styles.stagedTitle}>Staged for upload:</p>
                        {images.map((img, idx) => (
                            <div key={idx} className={styles.stagedRow}>
                                <span className={styles.fileName}>{img.name}</span>
                                <button
                                    type="button"
                                    className={styles.removeFileBtn}
                                    onClick={() => handleRemoveStagedImage(idx)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* color */}
            <div className={styles.field}>
                <label className={styles.label}>Colors (optional)</label>
                <div className={styles.tagInput}>
                    <input
                        type="text"
                        className={styles.input}
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        placeholder="e.g Red"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddColor();
                            }
                        }}
                    />
                    <button
                        type="button"
                        className={styles.addTagButton}
                        onClick={handleAddColor}
                    >
                        Add
                    </button>
                </div>

                {colors.length > 0 ? (
                    <div className={styles.tags}>
                        {colors.map((color) => (
                            <div key={color} className={styles.tag}>
                                <span>{color}</span>
                                <button
                                    type="button"
                                    className={styles.removeTag}
                                    onClick={() => handleRemoveColor(color)}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* sizes */}
            <div className={styles.field}>
                <label className={styles.label}>Sizes (optional)</label>
                <div className={styles.tagInput}>
                    <input
                        type="text"
                        className={styles.input}
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        placeholder="e.g M, XL"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSize();
                            }
                        }}
                    />
                    <button
                        type="button"
                        className={styles.addTagButton}
                        onClick={handleAddSize}
                    >
                        Add
                    </button>
                </div>

                {sizes.length > 0 ? (
                    <div className={styles.tags}>
                        {sizes.map((size) => (
                            <div key={size} className={styles.tag}>
                                <span>{size}</span>
                                <button
                                    type="button"
                                    className={styles.removeTag}
                                    onClick={() => handleRemoveSize(size)}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* buttons */}
            <div className={styles.buttons}>
                <button type="button" className={styles.cancelButton} onClick={onCancel}>
                    Cancel
                </button>

                <button type="button" className={styles.saveButton} onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
                </button>
            </div>
        </div>
    );
};

export default ProductForm;