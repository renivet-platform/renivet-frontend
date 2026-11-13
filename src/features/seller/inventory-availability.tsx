import Link from "next/link";
import styles from "./product-workspace.module.css";

export function InventoryAvailability({ brandId }: { brandId: string }) {
  return <main className={styles.page} aria-labelledby="inventory-title">
    <nav className={styles.detailBreadcrumb} aria-label="Breadcrumb">
      <Link href={`/brands/${encodeURIComponent(brandId)}/products`}>Products</Link>
      <span aria-hidden="true">/</span>
      <span>Inventory</span>
    </nav>
    <header className={styles.header}>
      <div><p className={styles.kicker}>BRAND WORKSPACE <span aria-hidden="true">/</span> STOCK</p><h1 id="inventory-title">Inventory</h1><p className={styles.subtitle}>Stock is always read from the platform’s authorized inventory service.</p></div>
      <span className={styles.draftBadge}>NOT CONNECTED</span>
    </header>
    <section className={styles.formPanel} aria-labelledby="inventory-status-title">
      <div className={styles.formHeading}><div><p className={styles.kicker}>LIVE DATA CONNECTION</p><h2 id="inventory-status-title">Inventory is not available yet</h2><p>No stock data is loaded. The backend inventory API routes are not registered, so this screen cannot safely show balances, adjustments, or transfers.</p></div></div>
      <p className={styles.readOnlyNotice} role="status">This page will show warehouse balances and inventory actions only after the protected backend APIs and access checks are ready.</p>
      <div className={styles.formActions}><p>Inventory stays authoritative in the backend.</p><Link className={styles.secondaryLink} href={`/brands/${encodeURIComponent(brandId)}/products`}>Return to products</Link></div>
    </section>
  </main>;
}
