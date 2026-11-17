import Link from "next/link";
import styles from "./workflow-gate.module.css";

export function WorkflowGate({ title, screen, detail, relatedHref = "/account", relatedLabel = "Account & security" }: {
  title: string;
  screen: string;
  detail: string;
  relatedHref?: string;
  relatedLabel?: string;
}) {
  return <main className={styles.page} aria-labelledby="workflow-gate-title">
    <p className={styles.kicker}>{screen}</p>
    <h1 id="workflow-gate-title">{title}</h1>
    <p className={styles.intro}>{detail}</p>
    <section className={styles.card} aria-labelledby="gate-status-title">
      <span className={styles.status}>Unavailable</span>
      <h2 id="gate-status-title">This workflow is not connected yet</h2>
      <p>Renivet has not approved and registered the API and access rules needed for this action. This page will not accept information or claim a change was saved.</p>
      <Link href={relatedHref}>{relatedLabel}</Link>
    </section>
  </main>;
}
