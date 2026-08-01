import styles from './Navbar.module.css';

function Navbar({ store }) {
    return(
        <div className={styles.navbar}>
            <div className={styles.brand}>
                {store?.logo ?(
                    <img
                    src={store.logo}
                    alt={store?.businessName}
                    className={styles.logo}
                    />
                ) : null}

                <div className={styles.brandInfo}>
                    <h1 className={styles.businessName}>{store?.businessName}</h1>
                    {store?.tagline ? (
                        <p className={styles.tagline}>{store.tagline}</p>
                    ) : null}
                </div>
            </div>

            {store?.totalReviews > 0 ? (
                <div className={styles.ratingRow}>
                    <span className={styles.ratingBadge}>
                        ★ {store.averageRating.toFixed(1)}
                    </span>
                </div>
            ) : null}
        </div>
    );
}

export default Navbar;