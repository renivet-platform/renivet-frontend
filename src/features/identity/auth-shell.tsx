import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark} aria-label="Renivet home">
          <span className={styles.wordmarkMark} aria-hidden="true">R</span>
          <span>renivet</span>
        </Link>
        <span className={styles.headerNote}>Your account</span>
      </header>

      <main className={styles.layout}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 id="auth-title" className={styles.heading}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        <section className={styles.card} aria-labelledby="auth-title">
          {children}
        </section>

        <p className={styles.securityNote}>
          Your sign-in is managed securely by Renivet.
        </p>
      </main>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerLink}>Back to storefront</Link>
        <span>© Renivet</span>
      </footer>
    </div>
  );
}
