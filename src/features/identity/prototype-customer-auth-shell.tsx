import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

/**
 * REN2-117: visual port of CU-08 and CU-09B from the 17 Nov W1/W2 prototype.
 * This is presentation only: the real sign-in, OTP, session and redirects
 * remain in SignInForm / auth-api.ts. No fictional prototype data is used.
 */
export function PrototypeCustomerAuthShell({ screenId, title, description, children }: {
  screenId: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const verification = screenId === "CU-09B";
  return <div className={styles.prototypePage} data-screen-id={screenId}>
    <header className={styles.prototypeHeader}>
      <Link href="/" className={styles.prototypeWordmark} aria-label="Renivet home">RENIVET</Link>
      <Link href="/" className={styles.prototypeBack}><span aria-hidden="true">‹</span> Back to shopping</Link>
    </header>
    <main className={verification ? styles.prototypeVerifyLayout : styles.prototypeLayout}>
      {!verification && <aside className={styles.prototypeArt} aria-label="Renivet commitments">
        <svg className={styles.prototypePattern} viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="renivet-ajrakh-auth" width="21.6" height="21.6" patternUnits="userSpaceOnUse">
              <g transform="scale(.9)">
                <rect width="24" height="24" fill="#23395b" />
                <path d="M12 2l4 10-4 10-4-10z" fill="#e9e2d0" opacity=".85" />
                <circle cx="12" cy="12" r="2.2" fill="#9b3b2a" />
                <circle cx="0" cy="0" r="3" fill="#9b3b2a" />
                <circle cx="0" cy="24" r="3" fill="#9b3b2a" />
                <circle cx="24" cy="0" r="3" fill="#9b3b2a" />
                <circle cx="24" cy="24" r="3" fill="#9b3b2a" />
              </g>
            </pattern>
          </defs>
          <rect width="200" height="250" fill="url(#renivet-ajrakh-auth)" />
        </svg>
        <div className={styles.prototypeScrim} aria-hidden="true" />
        <div className={styles.prototypeArtContent}>
          <h2>Good things, made slowly.</h2>
          <ul>
            <li><span aria-hidden="true">◇</span> Every brand is reviewed before it sells here</li>
            <li><span aria-hidden="true">◈</span> Claims tell you how they were checked</li>
            <li><span aria-hidden="true">♙</span> Your number is never shared with brands for marketing</li>
          </ul>
        </div>
      </aside>}
      <section className={styles.prototypeFormPanel} aria-labelledby="auth-title">
        <h1 id="auth-title" className={styles.prototypeTitle}>{title}</h1>
        <p className={styles.prototypeLead}>{description}</p>
        <div className={styles.prototypeCard}>{children}</div>
        {!verification && <p className={styles.prototypeLinks}>
          New and prefer email? <Link href="/register">Create an account with email</Link>
          {" · "} Selling on Renivet? <Link href="/brands">Brand workspace</Link>
        </p>}
      </section>
    </main>
    <footer className={styles.prototypeFooter}>
      <div><Link href="/privacy">Privacy notice</Link><Link href="/">Back to shopping</Link></div>
      <p>Renivet · independent Indian brands, reviewed before they sell</p>
    </footer>
  </div>;
}
