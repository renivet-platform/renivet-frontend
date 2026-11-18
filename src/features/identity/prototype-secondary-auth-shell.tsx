import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

/**
 * REN2-117, W1 screen family: convert the 17 November prototype's compact
 * customer onboarding/recovery layouts and account navigation into React.
 * Only presentation is owned here. Identity, consent, phone verification,
 * sessions and all mutations remain owned by existing live API adapters.
 */
interface Props { screenId: string; eyebrow: string; title: string; description: string; children: ReactNode }

function CustomerHeader({ account = false, staff = false }: { account?: boolean; staff?: boolean }) {
  return <header className={styles.prototypeHeader}>
    <Link href="/" className={styles.prototypeWordmark} aria-label="Renivet home">RENIVET</Link>
    {account
      ? <nav className={styles.prototypeAccountHeaderLinks} aria-label="Account navigation">
          <Link href="/">New in</Link><Link href="/shop/brands">Brands</Link><Link href="/account" aria-current="page">Account</Link>
        </nav>
      : staff ? <span className={styles.prototypeStaffHeader}>Renivet operations</span>
      : <Link href="/" className={styles.prototypeBack}><span aria-hidden="true">‹</span> Back to shopping</Link>}
  </header>;
}

function CustomerFooter() {
  return <footer className={styles.prototypeFooter}>
    <div><Link href="/legal/terms">Terms of use</Link><Link href="/privacy">Privacy notice</Link><Link href="/legal/grievance">Grievance officer</Link><Link href="/legal/help">Help</Link></div>
    <p>Renivet · independent Indian brands, reviewed before they sell</p>
  </footer>;
}

export function PrototypeCompactAuthShell({ screenId, eyebrow, title, description, children }: Props) {
  const isStaff = screenId === "AD-01";
  return <div className={styles.prototypePage} data-screen-id={screenId}>
    <CustomerHeader staff={isStaff} />
    <main className={styles.prototypeCompactMain} aria-labelledby="auth-title">
      {isStaff && <p className={styles.prototypeCompactEyebrow}>RENIVET OPERATIONS</p>}
      <h1 id="auth-title" className={styles.prototypeCompactTitle}>{title}</h1>
      <p className={styles.prototypeCompactLead}>{description}</p>
      <div className={styles.prototypeCompactCard}>{children}</div>
      {isStaff && <p className={styles.prototypeCompactHelp}>Staff access is granted by Renivet. Brands use <Link href="/sign-in">customer sign-in</Link>.</p>}
      {!isStaff && eyebrow === "Account recovery" && <p className={styles.prototypeCompactHelp}>Remembered your password? <Link href="/sign-in">Sign in</Link></p>}
    </main>
    <CustomerFooter />
  </div>;
}

export function PrototypeCustomerAccountShell({ screenId, title, description, children }: Props) {
  return <div className={styles.prototypePage} data-screen-id={screenId}>
    <CustomerHeader account />
    <main className={styles.prototypeAccountLayout}>
      <aside className={styles.prototypeAccountSidebar}>
        <nav aria-label="Account sections">
          <Link href="/account" aria-current="page">Account &amp; security</Link>
          <Link href="/privacy">Privacy &amp; communication</Link>
          <Link href="/privacy/requests">Data requests</Link>
        </nav>
      </aside>
      <section className={styles.prototypeAccountContent} aria-labelledby="auth-title">
        <h1 id="auth-title">{title}</h1>
        <p className={styles.prototypeAccountIntro}>{description}</p>
        <div className={styles.prototypeAccountCard}>{children}</div>
      </section>
    </main>
    <CustomerFooter />
  </div>;
}
