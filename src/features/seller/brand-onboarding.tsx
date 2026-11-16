"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./brand-workspace.module.css";

type AccessSummary = { brandName?: string; brandState?: string; membershipState?: string };
const setupAreas = [
  ["01", "Become a brand partner", "Your W1 application and approval state are resolved by the backend.", "Application state"],
  ["02", "Business profile", "Company identity and trading details are shown only when the authoritative onboarding service exposes them.", "Backend-controlled"],
  ["03", "Brand identity", "Brand name, logo, and identity changes remain tenant-scoped and approval-gated.", "Backend-controlled"],
  ["04", "Business documents", "Documents must be uploaded through the approved private storage flow; no public file URLs are exposed here.", "Private evidence"],
  ["05", "Payout verification", "Payout and bank verification are protected workflow steps and are not inferred from membership state.", "Approval required"],
  ["06", "Application status", "Use this page to confirm the persisted brand and membership status before entering W2 workflows.", "Live status"],
] as const;

export function BrandOnboarding({ brandId }: { brandId: string }) {
  const [access, setAccess] = useState<AccessSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    w2Request<AccessSummary>(["brands", brandId, "access"])
      .then(setAccess)
      .catch((caught: unknown) => setError(caught instanceof W2ApiError ? caught.message : "Onboarding status is unavailable."));
  }, [brandId]);
  const active = access?.membershipState?.toLowerCase() === "active";
  const brandPath = `/brands/${encodeURIComponent(brandId)}`;
  return <main className={styles.page} aria-labelledby="onboarding-title"><div className={styles.shell}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href={`${brandPath}/workspace`}>Workspace</Link><span aria-hidden="true">/</span><span>Onboarding</span></nav>
    <header className={styles.header}><div><p className={styles.kicker}>BRAND ACCESS STATUS</p><h1 id="onboarding-title">{access?.brandName ?? "Brand onboarding"}</h1><p className={styles.subtitle}>A clear view of what the backend has approved and which workspace actions are available.</p></div><span className={styles.state}>{active ? "Active membership" : access?.membershipState ?? "Loading status"}</span></header>
    {error && <div className={styles.error} role="alert"><strong>Access status unavailable</strong><div>{error}</div></div>}
    <section className={styles.hero}><strong>Approval is not inferred by the browser</strong><p>{access ? `The backend reports brand state “${access.brandState ?? "unknown"}” and membership “${access.membershipState ?? "unknown"}”.` : "Refresh this page after the W1 approval handoff has been persisted."}</p></section>
    <h2 className={styles.sectionTitle}>Brand setup checklist</h2>
    <section className={styles.setupGrid} aria-label="Brand onboarding areas">
      {setupAreas.map(([number, title, detail, status]) => <article className={styles.setupCard} key={number}><div className={styles.setupCardHeader}><span className={styles.stepNumber}>{number}</span><span className={styles.tag}>{status}</span></div><h3>{title}</h3><p>{detail}</p></article>)}
    </section>
    <section className={styles.steps} aria-label="Onboarding status"><div className={styles.step}><span className={styles.stepNumber}>1</span><strong>Application review</strong><span>{access?.brandState ?? "Waiting for backend status"}</span></div><div className={styles.step}><span className={styles.stepNumber}>2</span><strong>Brand membership</strong><span>{access?.membershipState ?? "Waiting for backend status"}</span></div><div className={styles.step}><span className={styles.stepNumber}>3</span><strong>Catalogue access</strong><span>{active ? "Available to this membership" : "Blocked until membership is active"}</span></div><div className={styles.step}><span className={styles.stepNumber}>4</span><strong>Protected actions</strong><span>Each mutation still requires backend permissions, CSRF, and any required MFA.</span></div></section>
    <h2 className={styles.sectionTitle}>Continue in the workspace</h2><div className={styles.actions}><Link className={`${styles.button} ${styles.primary}`} href={`${brandPath}/products`}>Open catalogue</Link><Link className={styles.button} href={`${brandPath}/imports`}>Import products</Link><Link className={styles.button} href={`${brandPath}/inventory`}>Inventory</Link></div>
    <p className={styles.footerNote}>If a setup action is unavailable, use the exact backend error and do not retry with a different brand identifier. Tenant and brand isolation are enforced server-side; this checklist never invents application or payout records.</p>
  </div></main>;
}
