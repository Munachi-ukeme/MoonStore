import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { createProduct, updateProduct, getCategories } from "../api/api";
import styles from "./ProductForm.module.css";

function ProductForm ({ editingProduct, onSaved, onCancel }) {
    const { seller } = useAuth();

    // figure out how many this plan allows
    let maxImages;
    if(seller?.plan === "basic") {
        maxImages = 1;
    } else if ( seller?.plan === "pro"){
        maxImages = 2;
    } else if ( seller?.plan === "premium"){
        maxImages = 3;
    } else{
        maxImages = 1;
    }

    const[name, setName] = useState("");


    const[description, setDescription] = useState("");

    const[categoryId, setCategoryId] = useState("")

    const[images, setImages] = useState([]);

    const[colors, setColors] = useState([]);

    const[sizes, setSizes] = useState([]);

    const[colorInput, setColorInput] = useState("");

    const[sizeInput, setSizeInput] = useState("");

    const[categories, setCategories] = useState([]);

    const[loading, setLoading] = useState(false);

    const[error, setError] = useState(null);

    const [originalPrice, setOriginalPrice] = useState("");

    const [displayPrice, setDisplayPrice] = useState(null);


    //load categories for the dropdown
    useEffect(() =>{
        const loadCategories = async() =>{
            const data = await getCategories();
            if (!data.error){
                setCategories(data);
            }
        };
        loadCategories();
    }, []);

    // if editing, fill the form with existing product data
    useEffect(() =>{
        if (editingProduct) {
            setName(editingProduct.name || "");
            setOriginalPrice(editingProduct.price || "");
            setDescription(editingProduct.description || "");
            setCategoryId(editingProduct.categoryId || "");
            setColors(editingProduct.colors || [])
            setSizes(editingProduct.sizes || []);
        } else {
            //reset form when adding new product
            setName("");
            setOriginalPrice("");
            setDisplayPrice(null)
            setDescription("");
            setCategoryId("");
            setImages([]);
            setColors([]);
            setSizes([]);
        }
    }, [editingProduct]);

    // add a color tag
    const handleAddColor = () =>{
        const trimmed = colorInput.trim();
        if (!trimmed) {
            return;
        }

        if (colors.includes(trimmed)) {
            return;
        }

        setColors([...colors, trimmed]);
        setColorInput("");
    };

    //remove a color tag
    const handleRemoveColor = (colorToRemove) =>{
        setColors(colors.filter((color) => color !== colorToRemove));
    };

    //add a size tag
    const handleAddSize = () =>{
        const trimmed = sizeInput.trim();
        if (!trimmed) {
            return;
        }

        if (sizes.includes(trimmed)){
            return;
        }
        setSizes([...sizes, trimmed]);
        setSizeInput("");
    };

    //remove a size tag
    const handleRemoveSize = (sizeToRemove) =>{
        setSizes(sizes.filter((size) => size !== sizeToRemove));
    };

    //handle image file selection
    const handleImageChange = (e) =>{
        const selectedFiles = Array.from(e.target.files);
        setImages(selectedFiles);
    };

    const handleSave = async () =>{
        setError(null);

        // basic validation
        if (!name) {
            setError("Product name is required.");
            return;
        }

        if(!originalPrice) {
            setError("Price is required.");
            return;
        }

        if(!categoryId){
            setError("Please select a category.");
            return;
        }

        if(!editingProduct && images.length === 0){
            setError("Please upload at least one image.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("price", displayPrice);
        formData.append("description", description);
        formData.append("categoryId", categoryId);

        //append colors as JSON string
        formData.append("colors", JSON.stringify(colors));

        //append sizes as JSON string
        formData.append("sizes", JSON.stringify(sizes));

        //append each image file
        images.forEach((image) =>{
            formData.append("images", image);
        });

        let data;
        if(editingProduct){
            data = await updateProduct(editingProduct._id, formData);
        } else {
            data = await createProduct(formData);
        }

        setLoading(false);

        if(data.error){
            setError(data.error);
            return;
        }

        //tell productpage the save was successful
        onSaved(data);
    };

    const grossUpPrice = (originalPrice) => {
        if (originalPrice >= 126667) {
    return originalPrice + 2000;
  }

  return Math.ceil((originalPrice + 100) / (1 - 0.015));
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

            {/* error message */}
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
      Buyer will pay <strong>₦{displayPrice.toLocaleString()}</strong>, this is Paystack transaction fee. You receive ₦{Number(originalPrice).toLocaleString()} exactly.
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
                onChange={(e) => setCategoryId(e.target.value)} >
                    <option value=""> Select a category</option>
                    {categories.map((cat) =>(
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* images */}
            <div className={styles.field}>
                <label className={styles.label}>Images (max {maxImages} for your plan)</label>
                <input
                type="file"
                accept="image/*"
                className={styles.input}
                onChange={handleImageChange}
                multiple
                />
                <p className={styles.hint}>
                    Your plan allows {maxImages} image
                    {maxImages > 1 ? "s" : ""} per product
                </p>
            </div>

            {/* color */}
            <div className={styles.field}>
                <label className={styles.label}> Colors (optional)</label>
                <div className={styles.tagInput}>
                <input
                type="text"
                className={styles.input}
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="e.g Red"
                onKeyDown={(e) => {
                    if (e.key === "Enter"){
                        handleAddColor();
                    }
                }}
                />
                <button
                className={styles.addTagButton}
                onClick={handleAddColor}
                >
                    Add
                </button>
            </div>

            {/* color tags */}
            {colors.length > 0 ? (
                <div className={styles.tags}>
                    {colors.map((color) =>(
                        <div key={color} className={styles.tag}>
                            <span>{color}</span>
                            <button 
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
                <label className={styles.label}> Sizes (optional)</label>

                <div className={styles.tagInput}>
                    <input
                    type="text" 
                    className={styles.input}
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    placeholder="e.g M, XL"
                    onKeyDown={(e) =>{
                        if(e.key === "Enter"){
                            handleAddSize();
                        }
                    }}
                    />
                    <button
                    className={styles.addTagButton}
                    onClick={handleAddSize}
                    >
                        Add
                    </button>
                </div>

                {/* size tags */}
                {sizes.length > 0 ? (
                    <div className={styles.tags}>
                        {sizes.map((size) =>(
                            <div key={size} className={styles.tag}>
                                <span>{size}</span>
                                <button className={styles.removeTag} onClick={() => handleRemoveSize(size)}>
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* button */}
            <div className={styles.buttons}>
                <button className={styles.cancelButton} onClick={onCancel}>
                    Cancel
                </button>

                <button className={styles.saveButton} onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
                </button>
            </div>
        </div>

        
    );
}

export default ProductForm;