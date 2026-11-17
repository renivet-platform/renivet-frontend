"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { W2ApiError, w2Request, type ProductPage } from "@/features/seller/w2-catalog";
import { summarizeProducts } from "@/features/seller/brand-workspace-model";
import styles from "./brand-workspace.module.css";

type AccessSummary = { brandName?: string; brandState?: string; membershipState?: string };

function errorMessage(error: unknown) {
  return error instanceof W2ApiError ? error.message : "The brand workspace could not be loaded. Try again shortly.";
}

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
    if (accessResult.status === "fulfilled") setAccess(accessResult.value);
    else setError(errorMessage(accessResult.reason));
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
  const workflowCards = [
    { key: "drafts", title: "Draft editor", detail: "Create or resume a product draft with a pinned taxonomy version and live validation.", href: `${brandPath}/products`, action: "Open draft editor" },
    { key: "product-details", title: "Variants, media & claims", detail: "Open a persisted product to manage its SKU matrix, private media, pricing and evidence.", href: `${brandPath}/products`, action: "Open product catalogue" },
    { key: "imports", title: "Import wizard", detail: "Use Shopify, Unicommerce/Uniware, Renivet or generic mappings with a frozen preview and retry path.", href: `${brandPath}/imports`, action: "Start an import" },
    { key: "inventory", title: "Stock console", detail: "Read the authoritative inventory ledger and submit controlled adjustments when the backend permits them.", href: `${brandPath}/inventory`, action: "Open inventory" },
    { key: "onboarding", title: "Onboarding & eligibility", detail: "Track the persisted application, verification and catalogue-eligibility status for this brand.", href: `${brandPath}/onboarding`, action: "View onboarding" },
    { key: "team", title: "Team access", detail: "Review redacted members and backend-resolved roles without granting access from the UI.", href: `${brandPath}/team`, action: "Review team access" },
  ] as const;
  return <main className={styles.page} aria-labelledby="workspace-title"><div className={styles.shell}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/account">Account</Link><span aria-hidden="true">/</span><span>Brand workspace</span></nav>
    <header className={styles.header}><div><p className={styles.kicker}>RENIVET BRAND WORKSPACE</p><h1 id="workspace-title">{access?.brandName ?? "Your brand workspace"}</h1><p className={styles.subtitle}>Create drafts, bring existing catalogue data across safely, and keep every operational change traceable.</p></div><span className={styles.state}>{loading ? "Loading access" : access?.membershipState ?? "Access status unavailable"}</span></header>
    {error && <div className={styles.error} role="alert"><strong>Workspace data unavailable</strong><div>{error}</div><button className={styles.button} type="button" onClick={() => void load()}>Try again</button></div>}
    <section className={styles.hero} aria-labelledby="status-title"><div><strong id="status-title">Your workspace at a glance</strong><p>{access ? `Brand state: ${access.brandState ?? "not reported"}. Membership: ${access.membershipState ?? "not reported"}.` : "Access and catalogue status are read from the backend; this screen never grants permissions."}</p></div><div className={styles.actions}><Link className={`${styles.button} ${styles.primary}`} href={`${brandPath}/products`}>Open products</Link><Link className={styles.button} href={`${brandPath}/imports`}>Import products</Link></div></section>
    <section className={styles.summaryGrid} aria-label="Catalogue status from loaded results" aria-live="polite">
      {[{ title: "Products", value: productCount, note: "total reported by service" }, { title: "Published", value: summary.live, note: "in loaded results" }, { title: "In review", value: summary.inReview, note: "in loaded results" }, { title: "Needs attention", value: summary.needsAttention, note: "in loaded results" }].map((item) => <article className={styles.summaryCard} key={item.title}><span>{item.title}</span><strong>{loading ? "—" : item.value ?? "Unavailable"}</strong><small>{item.note}</small></article>)}
    </section>
    {productsError && <div className={styles.error} role="status"><strong>Catalogue summary unavailable</strong><div>{productsError}</div></div>}
    {!productsError && hasMoreProducts && <p className={styles.muted}>Status counts summarize the {summary.loaded} products loaded on this page. The service reports {productCount} total products; open the catalogue to browse more.</p>}
    <section className={styles.attention} aria-labelledby="attention-title"><div className={styles.workflowHeading}><div><p className={styles.kicker}>CATALOGUE REVIEW</p><h2 id="attention-title">Needs attention</h2></div><Link className={styles.cardLink} href={`${brandPath}/products`}>View catalogue →</Link></div>{loading ? <p className={styles.muted}>Loading catalogue status…</p> : productsError ? <p className={styles.muted}>Product status cannot be shown until the catalogue responds.</p> : attentionProducts.length ? <ul className={styles.attentionList}>{attentionProducts.slice(0, 5).map((product) => <li key={product.id}><Link href={`${brandPath}/products/${encodeURIComponent(product.id)}`}><span><strong>{product.title}</strong><small>Style {product.styleCode}</small></span><span className={styles.tag}>{product.publicationState.replaceAll("_", " ")}</span></Link></li>)}</ul> : <p className={styles.muted}>{summary.loaded ? "No rejected or restricted products in the loaded results." : "No products were returned for this brand yet."}</p>}</section>
    <h2 className={styles.sectionTitle}>Your W2 workflows</h2>
    <section className={styles.grid} aria-label="Brand workspace areas">
      <article className={styles.card}><h2>Catalogue</h2><p>{productCount === null ? "The backend will report persisted product drafts and listings." : `${productCount} persisted product${productCount === 1 ? "" : "s"} are available to this brand.`}</p><Link className={styles.cardLink} href={`${brandPath}/products`}>Manage products →</Link></article>
      <article className={styles.card}><h2>Bulk imports</h2><p>Download the selected source template, upload privately, map columns, review a frozen preview, and retry only failed rows.</p><Link className={styles.cardLink} href={`${brandPath}/imports`}>Import products →</Link></article>
      <article className={styles.card}><h2>Inventory</h2><p>Read authoritative stock balances and submit controlled, audited adjustments through the inventory ledger.</p><Link className={styles.cardLink} href={`${brandPath}/inventory`}>Open inventory →</Link></article>
      <article className={styles.card}><h2>Access &amp; team</h2><p>Review the current membership, redacted team members, and permission grants resolved by the backend.</p><Link className={styles.cardLink} href={`${brandPath}/team`}>Review access →</Link></article>
    </section>
    <section className={styles.workflowSection} aria-labelledby="workflow-map-title">
      <div className={styles.workflowHeading}><div><p className={styles.kicker}>WORKSPACE AREAS</p><h2 id="workflow-map-title">Brand workflows</h2><p>These links open the relevant workspace screens. Availability and permissions are checked by Renivet services when each screen loads.</p></div><span className={styles.workflowCount}>{loading ? "Checking access..." : `${workflowCards.length} workspace areas`}</span></div>
      <div className={styles.workflowGrid}>
        {workflowCards.map((card, index) => <article className={styles.workflowCard} key={card.key}><div className={styles.workflowCardHeader}><span className={styles.workflowStatus}>WORKSPACE</span><span className={styles.workflowIndex}>{String(index + 1).padStart(2, "0")}</span></div><h3>{card.title}</h3><p>{card.detail}</p><Link className={styles.cardLink} href={card.href}>{card.action} -&gt;</Link></article>)}
      </div>
    </section>
    <h2 className={styles.sectionTitle}>A safer path from draft to review</h2>
    <section className={styles.steps} aria-label="Product workflow steps">
      {[['1', 'Choose a category', 'Use only an active leaf with a published schema.'], ['2', 'Save a draft', 'Resume work without publishing incomplete details.'], ['3', 'Complete evidence', 'Add variants, private media, prices, and claims.'], ['4', 'Submit for review', 'Freeze the exact revision for independent review.']].map(([number, title, detail]) => <div className={styles.step} key={number}><span className={styles.stepNumber}>{number}</span><strong>{title}</strong><span>{detail}</span></div>)}
    </section>
    <p className={styles.footerNote}>Backend authorization remains the source of truth. Empty, denied, stale, and unavailable states stay visible instead of being replaced with demo records.</p>
  </div></main>;
}
