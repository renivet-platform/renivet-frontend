import styles from "./operations-console.module.css";
import { adminOperationAreas } from "./operations-console-model";

const navigation = adminOperationAreas;
const reviews = adminOperationAreas.filter((area) => area.id !== "overview");

export function AdminOperationsConsole() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="#overview" aria-label="Renivet operations home">
          <span className={styles.brandMark} aria-hidden="true">R</span>
          <span className={styles.brandName}>renivet<span>OPERATIONS</span></span>
        </a>
        <p className={styles.navCaption}>WORKSPACE</p>
        <nav aria-label="Operations sections" className={styles.navigation}>
          {navigation.map((area) => (
            <a key={area.id} className={area.id === "overview" ? styles.navActive : styles.navLink} href={`#${area.id}`}>
              <span className={styles.navIndex}>{area.index}</span>
              {area.id === "quality" ? "Quality review" : area.id === "publishing" ? "Publishing" : area.id === "overview" ? "Overview" : area.title}
            </a>
          ))}
        </nav>
        <div className={styles.sidebarNote}>
          <span className={styles.noteMark} aria-hidden="true">i</span>
          <p>Administrative actions require a verified platform role and fresh backend authorization.</p>
        </div>
        <div className={styles.sidebarFoot}>
          <span className={styles.avatar} aria-hidden="true">R</span>
          <span><strong>Operations workspace</strong><small>W2 · preview</small></span>
        </div>
      </aside>

      <main className={styles.main} id="overview" aria-labelledby="operations-title">
        <header className={styles.topbar}>
          <p><span>Workspace</span><span aria-hidden="true">/</span><strong>Operations</strong></p>
          <span className={styles.previewBadge}><span aria-hidden="true" /> API-gated preview</span>
        </header>

        <div className={styles.content}>
          <div className={styles.safetyBanner} role="note">
            <span className={styles.safetyIcon} aria-hidden="true">i</span>
            <div><strong>No protected data is loaded.</strong><p>This screen describes the review workflows. It does not read seller data or perform administrative actions.</p></div>
            <span className={styles.previewLabel}>PREVIEW</span>
          </div>

          <section className={styles.hero} aria-labelledby="operations-title">
            <div>
              <p className={styles.eyebrow}>RENIVET · PLATFORM OPERATIONS</p>
              <h1 id="operations-title">Review work,<br /><em>with context.</em></h1>
              <p className={styles.heroCopy}>A careful review begins with the current revision, its evidence, and a clear record of who can decide.</p>
            </div>
            <div className={styles.heroAside}>
              <span className={styles.heroGlyph} aria-hidden="true">✳</span>
              <p>Every approval should point to the exact version reviewed.</p>
              <span>W2 · OPERATIONS PRINCIPLE</span>
            </div>
          </section>

          <section className={styles.statusPanel} aria-labelledby="readiness-title">
            <div className={styles.statusHeading}>
              <div><p className={styles.eyebrow}>CURRENT CONNECTION</p><h2 id="readiness-title">Review workspace readiness</h2></div>
              <span className={styles.statusPill}><span aria-hidden="true" /> Source-audited preview</span>
            </div>
            <p className={styles.statusCopy}>This page is a source-audited readiness preview, not a live API health check. It does not call reviewer APIs or load protected records; statuses below describe the registered backend routes and known missing reads.</p>
            <div className={styles.statusFacts}>
              <div><span>Data source</span><strong>No live data loaded</strong></div>
              <div><span>Reviewer authorization</span><strong>Backend required</strong></div>
              <div><span>Decision controls</span><strong>Gated</strong></div>
            </div>
          </section>

          <section className={styles.reviewSection} aria-labelledby="areas-title">
            <div className={styles.sectionTitle}>
              <div><p className={styles.eyebrow}>REVIEW AREAS</p><h2 id="areas-title">A clear path through each decision.</h2></div>
              <p>Choose an area to see what is ready and what the system still needs.</p>
            </div>
            <div className={styles.reviewGrid}>
              {reviews.map((area) => (
                <article key={area.id} id={area.id} className={styles.reviewCard} aria-labelledby={`${area.id}-title`}>
                  <div className={styles.cardTop}><span className={styles.cardIndex}>{area.index}</span><span className={styles.gatedBadge}>Gated</span></div>
                  <p className={styles.cardEyebrow}>{area.eyebrow}</p>
                  <h3 id={`${area.id}-title`}>{area.title}</h3>
                  <p className={styles.cardCopy}>{area.description}</p>
                  <div className={styles.availability} role="status">
                    <strong>{area.apiStatus}</strong>
                    <p>{area.availability}</p>
                  </div>
                  <div className={styles.routeInventory}>
                    <h4>Registered API routes</h4>
                    {area.registeredRoutes.length > 0 ? (
                      <ul aria-label={`${area.title} registered API routes`}>
                        {area.registeredRoutes.map((route) => <li key={route}><code>{route}</code></li>)}
                      </ul>
                    ) : <p>No registered route is listed for this workflow.</p>}
                    {area.id === "pricing" || area.id === "claims" ? <p>Queue and safe detail reads are missing.</p> : null}
                  </div>
                  <ul className={styles.gateList} aria-label={`${area.title} requirements`}>{area.gates.map((gate) => <li key={gate}>{gate}</li>)}</ul>
                  <button className={styles.disabledAction} type="button" disabled aria-disabled="true">Review action unavailable</button>
                </article>
              ))}
            </div>
          </section>

          <footer className={styles.footer}>
            <span>RENIVET · OPERATIONS</span>
            <span>G07 · G08 · G14 · G17 remain open</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
