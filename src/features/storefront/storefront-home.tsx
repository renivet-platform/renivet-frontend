import Link from "next/link";
import styles from "./storefront-home.module.css";

export function StorefrontHome() {
  return <div className={styles.page}>
    <header className={styles.header}><Link className={styles.wordmark} href="/">RENIVET</Link><nav aria-label="Main navigation"><Link href="/sign-in">Sign in</Link><Link className={styles.sellerLink} href="/brands/join">Sell on Renivet</Link></nav></header>
    <main className={styles.hero} aria-labelledby="storefront-title">
      <div className={styles.art} aria-hidden="true"><span className={styles.artLabel}>RENIVET · INDEPENDENT BRANDS</span><span className={styles.artPhrase}>Good things,<br />made slowly.</span><span className={styles.artRule} /></div>
      <section className={styles.copy}><p className={styles.kicker}>A considered marketplace</p><h1 id="storefront-title">A more thoughtful way to get dressed.</h1><p className={styles.lead}>Renivet brings independent Indian brands and their stories together.</p><div className={styles.actions}><Link className={styles.primary} href="/sign-in">Sign in or create an account</Link><Link className={styles.secondary} href="/brands/join">Sell on Renivet</Link></div><p className={styles.notice} role="status">Public product browsing and shopping are not available in this environment yet.</p></section>
    </main>
    <footer className={styles.footer}><span>Renivet · Independent brands</span><nav aria-label="Policies and account"><Link href="/privacy">Privacy</Link><Link href="/sign-in">Account</Link></nav></footer>
  </div>;
}
