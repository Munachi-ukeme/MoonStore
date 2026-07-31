import styles from "./CategoryTabs.module.css";

function CategoryTabs({ categories = [], activeTab, onSelectCategory }) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.tabs}>
                <button
                    className={activeTab === "all" ? `${styles.tab} ${styles.activeTab}` : styles.tab}
                    onClick={() => onSelectCategory("all")}
                >
                    All
                </button>

                {categories?.map((cat) => (
                    <button
                        key={cat._id}
                        className={activeTab === cat._id ? `${styles.tab} ${styles.activeTab}` : styles.tab}
                        onClick={() => onSelectCategory(cat._id)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default CategoryTabs;