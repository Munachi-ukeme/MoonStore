import { useState } from "react";
import styles from "./CategoryTabs.module.css";

function CategoryTabs ({ categories, onSelectCategory}){
    const [activeTab, setActiveTab] = useState("all");

    const handleTabClick = (categoryId) =>{
        setActiveTab(categoryId);
        onSelectCategory(categoryId);
    };

    return(
        <div className={styles.wrapper}>
            <div className={styles.tabs}>
                {/* all tab - always first */}
                <button
                className={activeTab === "all" ? `${styles.tab} ${styles.activeTab}`: styles.tab}
                onClick={() => handleTabClick("all")}
                >
                    All
                </button>

                {/* one tab per category */}
                {categories?.categories?.map((cat) =>(
                    <button key={cat._id} className={activeTab === cat._id ? `${styles.tab} ${styles.activeTab}` : styles.tab}
                    onClick={() => handleTabClick(cat._id)}>
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default CategoryTabs;