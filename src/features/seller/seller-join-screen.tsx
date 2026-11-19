import Link from "next/link";
import styles from "./seller-join-screen.module.css";

const documents = ["GSTIN, or an exemption declaration", "PAN of the business", "Trademark certificate or brand authorisation", "ID for the authorised signatory", "Bank proof for the payout account"];
const steps = ["You apply", "Renivet reviews your business details and evidence", "You add products", "We check each product before publication"];

export function SellerJoinScreen() {
  return <main className={styles.page} data-screen-id="SE-01">
    <header className={styles.header}><Link href="/" className={styles.wordmark}>RENIVET</Link><nav aria-label="Seller navigation"><Link href="/brands">Your brands</Link><Link href="/sign-in?next=%2Fbrands%2Fjoin">Sign in</Link></nav></header>
    <div className={styles.content}>
      <header className={styles.intro}><p className={styles.kicker}>SELLER PARTNERSHIPS</p><h1>Sell your brand on Renivet</h1><p>Renivet is a curated marketplace. We review every brand and product so shoppers can trust what they buy.</p></header>
      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          <section className={styles.panel}><h2>Who can apply</h2><ul className={styles.eligibility}><li>A business registered in India: proprietorship, partnership, LLP or company.</li><li>You own the brand, or have written permission from the owner to sell it.</li><li>You can tell shoppers what your products are made of and who made them.</li></ul></section>
          <section className={styles.panel}><h2>Keep these ready</h2><ul className={styles.documentList}>{documents.map((item) => <li key={item}>{item}</li>)}</ul><p className={styles.note}>Private documents are not collected in this preview.</p></section>
          <section className={styles.panel}><h2>What happens next</h2><ol className={styles.timeline}>{steps.map((item, index) => <li key={item}><span>{index + 1}</span><div><strong>{item}</strong>{index === 1 && <small>If information is missing, Renivet will explain what needs to change.</small>}</div></li>)}</ol></section>
        </div>
        <aside className={styles.sideColumn}>
          <section className={styles.ready}><h2>Ready?</h2><p>Your details stay private to you and Renivet’s verification team.</p><Link className={styles.primary} href="/brands/join/application">Start application</Link><p className={styles.signin}>Already started? <Link href="/brands">Open your brands</Link></p><p className={styles.serviceNote} role="status"><strong>Initial application connected.</strong> Your brand and business name are saved to the review queue. Sensitive documents and payout verification are not collected in this first step.</p></section>
          <section className={styles.guideline}><h2>What we look for</h2><ul><li>Clear information about materials and makers</li><li>Specific claims supported by evidence</li><li>Photos that show the real product</li></ul></section>
        </aside>
      </div>
    </div>
    <footer className={styles.footer}><span>Renivet · Independent Indian brands</span><nav><Link href="/legal/terms">Terms of use</Link><Link href="/legal/privacy">Privacy notice</Link></nav></footer>
  </main>;
}
