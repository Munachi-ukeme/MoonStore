import styles from "./SearchBar.module.css";

function SearchBar({ value, onChange }) {
    return (
        <div className={styles.wrapper}>
            <input
                type="text"
                className={styles.input}
                placeholder="Search products..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

export default SearchBar;