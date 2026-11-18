import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./privacy-prototype.module.css";

/**
 * REN2-117 CU-21A / CU-21B.
 * The 17-Nov handoff includes fictional consent dates and request records.
 * Real consent, preferences and data request contracts do not yet exist in
 * renivet.openapi.json. This component intentionally makes no API call and
 * never claims that a preference/request has been persisted or submitted.
 */
function PrivacyLayout({ screenId, active, title, lead, children }: {
  screenId: "CU-21A" | "CU-21B";
  active: "preferences" | "requests";
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return <div className={styles.page} data-screen-id={screenId}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand} aria-label="Renivet home">RENIVET</Link>
      <nav aria-label="Store navigation" className={styles.topLinks}>
        <Link href="/">New in</Link>
        <Link href="/shop/brands">Brands</Link>
        <Link href="/account">Account</Link>
      </nav>
    </header>
    <main className={styles.layout}>
      <aside className={styles.sidebar}>
        <nav aria-label="Account sections">
          <Link href="/account">Account &amp; security</Link>
          <Link href="/privacy" aria-current={active === "preferences" ? "page" : undefined}>Privacy &amp; communication</Link>
          <Link href="/privacy/requests" aria-current={active === "requests" ? "page" : undefined}>Data requests</Link>
        </nav>
      </aside>
      <section className={styles.content} aria-labelledby="privacy-screen-title">
        <h1 id="privacy-screen-title">{title}</h1>
        <p className={styles.lead}>{lead}</p>
        {children}
      </section>
    </main>
    <footer className={styles.footer}>
      <nav aria-label="Legal links"><Link href="/legal/terms">Terms of use</Link><Link href="/legal/privacy">Privacy notice</Link><Link href="/account">Account &amp; security</Link></nav>
      <p>Renivet · independent Indian brands, reviewed before they sell</p>
    </footer>
  </div>;
}

function PendingConnection({ children }: { children: ReactNode }) {
  return <div className={styles.pending} role="status">
    <strong>Privacy services are not connected yet</strong>
    <p>{children}</p>
  </div>;
}

export function PrivacyPreferencesScreen() {
  return <PrivacyLayout screenId="CU-21A" active="preferences" title="Privacy & communication"
    lead="Manage which updates you receive and see what Renivet records about your choices.">
    <section className={styles.card} aria-labelledby="messages-title">
      <h2 id="messages-title">Messages we always send</h2>
      <p>Sign-in codes, order confirmations, delivery and refund updates are essential to operating your account; these cannot be switched off in marketing preferences.</p>
      <h3>Optional updates</h3>
      <fieldset className={styles.unavailableOptions} disabled aria-describedby="preferences-unavailable">
        <legend className={styles.srOnly}>Marketing preferences (not yet available)</legend>
        <label><input type="checkbox" /> New brands and collections by email</label>
        <label><input type="checkbox" /> New brands and collections on WhatsApp</label>
      </fieldset>
      <PendingConnection>
        Consent wording, current preference values, notice versions and the save API require approval. Checkboxes are disabled and no choice is assumed or recorded.
      </PendingConnection>
      <p id="preferences-unavailable" className={styles.note}>Saving marketing preferences will become available only when the secure consent API is implemented.</p>
    </section>
    <section className={styles.infoCard} aria-labelledby="consent-title">
      <h2 id="consent-title">What you agreed to</h2>
      <p>Your accepted notice version and date will appear here after the signed consent record API is available. We will not display the fictional consent details from the design prototype.</p>
      <p>For account export or deletion information, see <Link href="/privacy/requests">Data requests</Link>.</p>
    </section>
  </PrivacyLayout>;
}

export function PrivacyRequestsScreen() {
  return <PrivacyLayout screenId="CU-21B" active="requests" title="Data requests"
    lead="Ask for a copy of your data or request account deletion.">
    <section className={styles.card} aria-labelledby="requests-title">
      <div className={styles.sectionHeading}><h2 id="requests-title">Your requests</h2><span className={styles.unavailableBadge}>Not connected</span></div>
      <div className={styles.tableWrap} role="region" aria-label="Data request status">
        <table><thead><tr><th scope="col">Request</th><th scope="col">Submitted</th><th scope="col">Status</th></tr></thead>
          <tbody><tr><td colSpan={3} className={styles.empty}>Request history cannot be loaded until the authorized privacy request API is available. This does not mean that you have no requests.</td></tr></tbody>
        </table>
      </div>
      <PendingConnection>
        Export, deletion, identity re-verification, legal retention decisions and request tracking need an approved backend workflow. No request has been submitted from this screen.
      </PendingConnection>
    </section>
    <section className={styles.infoCard} aria-labelledby="handling-title">
      <h2 id="handling-title">How data requests will work</h2>
      <p>When Renivet enables this service, you will be asked to verify your identity before sensitive data is exported or an account deletion request is processed.</p>
      <p>Any response timeline and legal exceptions will be shown only after the applicable policy and operations procedure are approved.</p>
      <Link href="/legal/privacy">Read the current privacy notice</Link>
    </section>
  </PrivacyLayout>;
}
