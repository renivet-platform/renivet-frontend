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
              <span className={styles.statusPill}><span aria-hidden="true" /> Not connected</span>
            </div>
            <p className={styles.statusCopy}>The UI is ready to present the review areas. Protected queues and reviewer identity are not connected in this frontend, so no live work is shown here.</p>
            <div className={styles.statusFacts}>
              <div><span>Data source</span><strong>Not connected</strong></div>
              <div><span>Reviewer authorization</span><strong>Backend required</strong></div>
              <div><span>Decision controls</span><strong>Unavailable</strong></div>
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
                  <div className={styles.cardTop}><span className={styles.cardIndex}>{area.index}</span><span className={styles.gatedBadge}>GATED</span></div>
                  <p className={styles.cardEyebrow}>{area.eyebrow}</p>
                  <h3 id={`${area.id}-title`}>{area.title}</h3>
                  <p className={styles.cardCopy}>{area.description}</p>
                  <div className={styles.availability} role="status">
                    <strong>Not available yet</strong>
                    <p>{area.availability}</p>
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
