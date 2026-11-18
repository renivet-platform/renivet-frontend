import Link from "next/link";
import styles from "./workflow-gate.module.css";

export function WorkflowGate({ title, screen, detail, relatedHref = "/account", relatedLabel = "Account & security" }: {
  title: string;
  screen: string;
  detail: string;
  relatedHref?: string;
  relatedLabel?: string;
}) {
  const screenId = screen.match(/\b(?:CU|SE|AD)-[A-Z0-9]+\b/)?.[0];
  return <main className={styles.page} aria-labelledby="workflow-gate-title" data-screen-id={screenId}>
    <div className={styles.topline}><Link href="/" className={styles.wordmark}>RENIVET</Link><Link href={relatedHref}>{relatedLabel}</Link></div>
    <div className={styles.layout}>
      <header className={styles.heading}>
        <p className={styles.kicker}>{screen}</p>
        <h1 id="workflow-gate-title">{title}</h1>
        <p className={styles.intro}>{detail}</p>
        <p className={styles.assurance}><span aria-hidden="true">✓</span> Your account and saved data stay protected while this workflow is being connected.</p>
      </header>
      <section className={styles.card} aria-labelledby="gate-status-title">
        <div className={styles.cardTop}><span className={styles.icon} aria-hidden="true">R</span><span className={styles.status}>Not connected</span></div>
        <h2 id="gate-status-title">This screen is ready for its approved workflow</h2>
        <p>There is no registered API for this action yet. Renivet will not show sample records, collect sensitive details, or claim a change was saved.</p>
        <div className={styles.checklist}>
          <p><span aria-hidden="true">✓</span> Screen and navigation are available</p>
          <p><span aria-hidden="true">✓</span> No business data is fabricated</p>
          <p><span aria-hidden="true">○</span> Secure backend connection pending</p>
        </div>
        <Link className={styles.action} href={relatedHref}>{relatedLabel}</Link>
      </section>
    </div>
  </main>;
}
