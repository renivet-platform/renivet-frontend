import Link from "next/link";
import styles from "./seller-onboarding-prototype.module.css";

/** SE-18 source-aligned, intentionally gated pending approved bank privacy/
 * change/verification contracts. It does NOT read or fabricate bank details. */
export function PayoutAccountScreen({ brandId }: { brandId: string }) {
  const brandPath = `/brands/${encodeURIComponent(brandId)}`;
  return <main className={styles.page} data-screen-id="SE-18" aria-labelledby="payout-title">
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href={`${brandPath}/workspace`}>Workspace</Link><span aria-hidden="true">/</span><span>Payout account</span></nav>
    <header className={styles.heading}>
      <div><h1 id="payout-title">Payout account</h1><p>Where Renivet sends your earnings.</p></div>
    </header>
    <div className={styles.payoutGrid}>
      <section className={styles.card} aria-labelledby="account-title">
        <div className={styles.cardHeader}><h2 id="account-title">Current account</h2><span className={styles.pendingBadge}>Not connected</span></div>
        <dl className={styles.payoutDetails}>
          <div><dt>Account holder</dt><dd>Not available</dd></div>
          <div><dt>Account number</dt><dd>Not available</dd></div>
          <div><dt>IFSC</dt><dd>Not available</dd></div>
          <div><dt>Verified</dt><dd>Cannot be confirmed</dd></div>
        </dl>
        <p className={styles.warning} role="status"><strong>Secure bank details are unavailable</strong>
          The payout read/change endpoints and independent finance verification workflow are not yet approved. Renivet does not ask you to enter account or proof details in this screen.</p>
        <button type="button" disabled className={styles.disabledAction}>Change payout account (not available)</button>
      </section>
      <aside className={styles.card} aria-labelledby="payout-help">
        <h2 id="payout-help">How payouts work</h2>
        <ul className={styles.guidanceList}>
          <li>Renivet finance arranges approved payouts manually.</li>
          <li>Account changes will require secure proof and independent verification.</li>
          <li>A pending change pauses payouts until verified, with owner notification.</li>
          <li>Bank account details are not shared with shoppers.</li>
        </ul>
        <Link href={`${brandPath}/workspace`} className={styles.inlineLink}>Return to workspace</Link>
      </aside>
    </div>
  </main>;
}
