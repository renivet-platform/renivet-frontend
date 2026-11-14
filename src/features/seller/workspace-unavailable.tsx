import Link from "next/link";
import styles from "./product-workspace.module.css";

export function WorkspaceUnavailable({ section }: { section: string }) {
  return <main className={styles.page} aria-labelledby="workspace-unavailable-title">
    <header className={styles.header}>
      <div>
        <p className={styles.kicker}>RENIVET BRAND WORKSPACE</p>
        <h1 id="workspace-unavailable-title">Brand workspace unavailable</h1>
        <p className={styles.subtitle}>The {section} workspace is not available yet. W2 access is currently turned off while its required release checks are completed.</p>
      </div>
    </header>
    <section className={styles.formPanel} aria-labelledby="workspace-status-title">
      <div className={styles.formHeading}>
        <div>
          <p className={styles.kicker}>WORKSPACE STATUS</p>
          <h2 id="workspace-status-title">No brand data was loaded</h2>
          <p>This link is valid, but the workspace is not open yet. No brand information was requested or displayed.</p>
        </div>
      </div>
      <div className={styles.formActions}>
        <p>Your account and brand access remain protected.</p>
        <Link className={styles.secondaryButton} href="/account">Return to account</Link>
      </div>
    </section>
  </main>;
}
