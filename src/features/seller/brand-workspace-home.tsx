"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { W2ApiError, w2Request, type ProductPage } from "@/features/seller/w2-catalog";
import { summarizeProducts } from "@/features/seller/brand-workspace-model";
import styles from "./brand-home-prototype.module.css";

type AccessSummary = { brandName?: string; brandState?: string; membershipState?: string };

function errorMessage(error: unknown) {
  if (error instanceof W2ApiError) {
    if (error.status === 401) return "Your session expired. Sign in again to continue.";
    if (error.status === 403) return "Your account cannot access this brand workspace.";
    if (error.status === 503) return "The workspace is temporarily unavailable.";
  }
  return "We could not load the brand workspace. Please try again.";
}

/** REN2-117 SE-07 · Visual implementation of the approved 17-Nov prototype.
 * The original prototype's fictional tasks/counts are intentionally excluded:
 * all metrics and attention rows below come from the existing W2 NestJS API.
 */
export function BrandWorkspaceHome({ brandId }: { brandId: string }) {
  const [access, setAccess] = useState<AccessSummary | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductPage["items"]>([]);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const [accessResult, productsResult] = await Promise.allSettled([
      w2Request<AccessSummary>(["brands", brandId, "access"]),
      w2Request<ProductPage>(["brands", brandId, "products"], { query: { limit: "50" } }),
    ]);
    if (accessResult.status === "fulfilled") {
      setAccess(accessResult.value);
    } else {
      setAccess(null);
      setError(errorMessage(accessResult.reason));
    }
    if (productsResult.status === "fulfilled") {
      setProductCount(productsResult.value.totalCount);
      setProducts(productsResult.value.items);
      setHasMoreProducts(Boolean(productsResult.value.nextCursor));
      setProductsError("");
    } else {
      setProductsError(errorMessage(productsResult.reason));
      setProductCount(null);
      setProducts([]);
      setHasMoreProducts(false);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [brandId]);

  const brandPath = `/brands/${encodeURIComponent(brandId)}`;
  const summary = summarizeProducts(products);
  const attentionProducts = products.filter((product) => product.publicationState === "REJECTED" || product.publicationState === "RESTRICTED");
  const stats = [
    { label: "All products", value: productCount, note: "Total reported by catalogue" },
    { label: "Live products", value: productsError ? null : summary.live, note: "In the loaded results" },
    { label: "In review at Renivet", value: productsError ? null : summary.inReview, note: "In the loaded results" },
    { label: "Needs your attention", value: productsError ? null : summary.needsAttention, note: "In the loaded results" },
  ];

  return <main className={styles.page} data-screen-id="SE-07" aria-labelledby="workspace-title">
    <header className={styles.header}>
      <div>
        <h1 id="workspace-title">Welcome back</h1>
        <p>{access?.brandName ?? "Your brand"} · {access?.membershipState ?? (loading ? "Checking access" : "Access state unavailable")}</p>
      </div>
      <div className={styles.headerActions}>
        <Link className={styles.secondaryButton} href={`${brandPath}/imports`}>Import products</Link>
        <Link className={styles.primaryButton} href={`${brandPath}/products`}>Add a product</Link>
      </div>
    </header>
    {error && <section className={styles.error} role="alert"><strong>Brand access could not be loaded</strong><p>{error}</p><button type="button" onClick={() => void load()} className={styles.secondaryButton}>Try again</button></section>}
    <section className={styles.stats} aria-label="Live catalogue summary" aria-live="polite">
      {stats.map((stat) => <article className={styles.stat} key={stat.label}>
        <strong>{loading || stat.value === null ? "—" : stat.value}</strong>
        <span>{stat.label}</span>
        <small>{stat.note}</small>
      </article>)}
    </section>
    {productsError && <section className={styles.error} role="status"><strong>Catalogue data unavailable</strong><p>{productsError}</p></section>}
    {hasMoreProducts && !productsError && <p className={styles.partialNote}>Review and status counts describe the first {summary.loaded} products returned by the API, not every product in the catalogue.</p>}
    <div className={styles.columns}>
      <section className={styles.attentionCard} aria-labelledby="attention-title">
        <div className={styles.attentionHeader}>
          <h2 id="attention-title">Needs your attention</h2>
          {!loading && !productsError && <span>{attentionProducts.length}{hasMoreProducts ? "+" : ""} items in loaded results</span>}
        </div>
        {loading ? <p className={styles.empty} role="status">Checking catalogue and review states…</p>
          : productsError ? <p className={styles.empty}>Review items cannot be shown while the catalogue is unavailable.</p>
          : attentionProducts.length ? <ul className={styles.attentionList}>
            {attentionProducts.slice(0, 8).map((product) => <li key={product.id}>
              <div>
                <strong>{product.title}</strong>
                <p>{product.publicationState === "RESTRICTED" ? "Restricted: review the product before resubmitting." : "Review needs changes before this product can be published."} · Style {product.styleCode}</p>
              </div>
              <Link className={styles.secondaryButton} href={`${brandPath}/products/${encodeURIComponent(product.id)}`}>Fix listing</Link>
            </li>)}
          </ul> : <div className={styles.empty}>
            <p>{summary.loaded === 0 ? "No products have been returned for this brand yet." : "No rejected or restricted products in the loaded results."}</p>
            <Link className={styles.textLink} href={`${brandPath}/products`}>Open products</Link>
          </div>}
        <div className={styles.attentionFooter}>
          <Link href={`${brandPath}/products`}>View all products</Link>
          <Link href={`${brandPath}/imports`}>Check import results</Link>
        </div>
      </section>
      <aside className={styles.guidance} aria-label="How to work with Renivet">
        <section className={styles.guidanceCard}>
          <h2>How products go live</h2>
          <ol>
            <li>Add details, sizes and colours, photos and prices.</li>
            <li>Add any sustainability claims with evidence.</li>
            <li>Submit for review. Renivet checks photos, details, prices and claims.</li>
            <li>After independent approval, Renivet publishes the product.</li>
          </ol>
        </section>
        <section className={styles.tip}>
          <h2>Tip</h2>
          <p>Shoppers buy on fit, fabric and photos first. Fill size measurements and add a close-up of the fabric.</p>
        </section>
        <p className={styles.disclaimer}>Your workspace shows only backend-reported state. Stock adjustments, approvals and publication are controlled by Renivet services.</p>
      </aside>
    </div>
  </main>;
}
