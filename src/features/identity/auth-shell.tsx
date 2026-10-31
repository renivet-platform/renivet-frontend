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
        <span className={styles.headerNote}><span aria-hidden="true" />Your account</span>
      </header>

      <main className={styles.layout}>
        <aside className={styles.brandPanel} aria-label="Renivet account">
          <div className={styles.brandIntro}>
            <p className={styles.brandEyebrow}>A MORE CONSIDERED WARDROBE</p>
            <h2 className={styles.brandHeading}>Make room for <em>your kind</em> of style.</h2>
            <p className={styles.brandDescription}>A thoughtful place to begin, and a familiar place to return.</p>
          </div>

          <div className={styles.artwork} aria-hidden="true">
            <div className={styles.artHalo} />
            <div className={styles.artCard}>
              <span className={styles.artLabel}>RENIVET <span>—</span> PERSONAL STYLE</span>
              <div className={styles.artComposition}>
                <span className={styles.artSun} />
                <span className={styles.artFold} />
                <span className={styles.artSwatch} />
              </div>
              <span className={styles.artCaption}>A space that feels like yours.</span>
            </div>
            <span className={styles.artOrbit} />
          </div>

          <div className={styles.brandFooter}>
            <span className={styles.brandFooterLine} />
            <span>Personal style, at your pace.</span>
          </div>
        </aside>

        <section className={styles.formPanel} aria-labelledby="auth-title">
          <div className={styles.intro}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 id="auth-title" className={styles.heading}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>

          <div className={styles.card}>{children}</div>

          <p className={styles.securityNote}>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path d="M10 2.5 16 5v4.4c0 3.8-2.5 6.5-6 8.1-3.5-1.6-6-4.3-6-8.1V5l6-2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="m7.5 9.8 1.7 1.7 3.5-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Your sign-in is managed securely by Renivet.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerLink}>Back to storefront</Link>
        <span>© Renivet</span>
      </footer>
    </div>
  );
}
