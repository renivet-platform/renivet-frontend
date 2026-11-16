"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { W2ApiError, w2Request, type ProductPage } from "@/features/seller/w2-catalog";
import styles from "./brand-workspace.module.css";

type AccessSummary = { brandName?: string; brandState?: string; membershipState?: string };

function errorMessage(error: unknown) {
  return error instanceof W2ApiError ? error.message : "The brand workspace could not be loaded. Try again shortly.";
}

export function BrandWorkspaceHome({ brandId }: { brandId: string }) {
  const [access, setAccess] = useState<AccessSummary | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const [accessResult, productsResult] = await Promise.allSettled([
      w2Request<AccessSummary>(["brands", brandId, "access"]),
      w2Request<ProductPage>(["brands", brandId, "products"], { query: { limit: "1" } }),
    ]);
    if (accessResult.status === "fulfilled") setAccess(accessResult.value);
    else setError(errorMessage(accessResult.reason));
    if (productsResult.status === "fulfilled") setProductCount(productsResult.value.totalCount);
    else if (accessResult.status === "fulfilled") setError(errorMessage(productsResult.reason));
    setLoading(false);
  }

  useEffect(() => { void load(); }, [brandId]);

  const brandPath = `/brands/${encodeURIComponent(brandId)}`;
  return <main className={styles.page} aria-labelledby="workspace-title"><div className={styles.shell}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/account">Account</Link><span aria-hidden="true">/</span><span>Brand workspace</span></nav>
    <header className={styles.header}><div><p className={styles.kicker}>RENIVET BRAND WORKSPACE</p><h1 id="workspace-title">{access?.brandName ?? "Your brand workspace"}</h1><p className={styles.subtitle}>Create drafts, bring existing catalogue data across safely, and keep every operational change traceable.</p></div><span className={styles.state}>{loading ? "Loading access" : access?.membershipState ?? "Access status unavailable"}</span></header>
    {error && <div className={styles.error} role="alert"><strong>Workspace data unavailable</strong><div>{error}</div><button className={styles.button} type="button" onClick={() => void load()}>Try again</button></div>}
    <section className={styles.hero} aria-labelledby="status-title"><strong id="status-title">Live workspace status</strong><p>{access ? `Brand state: ${access.brandState ?? "not reported"}. Membership: ${access.membershipState ?? "not reported"}.` : "Access and catalogue status are read from the backend; this screen never grants permissions."}</p><div className={styles.actions}><Link className={`${styles.button} ${styles.primary}`} href={`${brandPath}/products`}>Open products</Link><Link className={styles.button} href={`${brandPath}/onboarding`}>View onboarding status</Link><Link className={styles.button} href={`${brandPath}/team`}>Team &amp; permissions</Link></div></section>
    <h2 className={styles.sectionTitle}>Your W2 workflows</h2>
    <section className={styles.grid} aria-label="Brand workspace areas">
      <article className={styles.card}><h2>Catalogue</h2><p>{productCount === null ? "The backend will report persisted product drafts and listings." : `${productCount} persisted product${productCount === 1 ? "" : "s"} are available to this brand.`}</p><Link className={styles.cardLink} href={`${brandPath}/products`}>Manage products →</Link></article>
      <article className={styles.card}><h2>Bulk imports</h2><p>Download the selected source template, upload privately, map columns, review a frozen preview, and retry only failed rows.</p><Link className={styles.cardLink} href={`${brandPath}/imports`}>Import products →</Link></article>
      <article className={styles.card}><h2>Inventory</h2><p>Read authoritative stock balances and submit controlled, audited adjustments through the inventory ledger.</p><Link className={styles.cardLink} href={`${brandPath}/inventory`}>Open inventory →</Link></article>
      <article className={styles.card}><h2>Access &amp; team</h2><p>Review the current membership, redacted team members, and permission grants resolved by the backend.</p><Link className={styles.cardLink} href={`${brandPath}/team`}>Review access →</Link></article>
    </section>
    <h2 className={styles.sectionTitle}>A safer path from draft to review</h2>
    <section className={styles.steps} aria-label="Product workflow steps">
      {[['1', 'Choose a category', 'Use only an active leaf with a published schema.'], ['2', 'Save a draft', 'Resume work without publishing incomplete details.'], ['3', 'Complete evidence', 'Add variants, private media, prices, and claims.'], ['4', 'Submit for review', 'Freeze the exact revision for independent review.']].map(([number, title, detail]) => <div className={styles.step} key={number}><span className={styles.stepNumber}>{number}</span><strong>{title}</strong><span>{detail}</span></div>)}
    </section>
    <p className={styles.footerNote}>Backend authorization remains the source of truth. Empty, denied, stale, and unavailable states stay visible instead of being replaced with demo records.</p>
  </div></main>;
}
