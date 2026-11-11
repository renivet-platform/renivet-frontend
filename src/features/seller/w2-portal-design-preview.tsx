import styles from "./w2-portal-design-preview.module.css";

const journeys = [
  { id: "products", label: "Products", number: "01", detail: "Build a draft, add variants, then prepare it for review." },
  { id: "imports", label: "Imports", number: "02", detail: "Map a file, review every change, and recover failed rows." },
  { id: "inventory", label: "Inventory", number: "03", detail: "Read authoritative stock and submit controlled corrections." },
  { id: "operations", label: "Operations", number: "04", detail: "Review taxonomy, prices, claims, and product quality." },
];

export function W2PortalDesignPreview() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <a className={styles.wordmark} href="#workspace" aria-label="Renivet W2 preview home">
          <span className={styles.mark} aria-hidden="true">R</span>
          <span>renivet<span className={styles.wordmarkSub}>WORKSPACE</span></span>
        </a>
        <div className={styles.sideCaption}>YOUR BUSINESS</div>
        <nav aria-label="W2 portal preview navigation" className={styles.nav}>
          {journeys.map((journey) => (
            <a key={journey.id} href={`#${journey.id}`} className={journey.id === "products" ? styles.navActive : styles.navLink}>
              <span className={styles.navIcon} aria-hidden="true">{journey.number}</span>
              {journey.label}
            </a>
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <span className={styles.avatar} aria-hidden="true">W</span>
          <span><strong>Workspace preview</strong><small>Design concept · W2</small></span>
          <span className={styles.chevron} aria-hidden="true">⌄</span>
        </div>
      </aside>

      <main id="workspace" className={styles.main} aria-labelledby="workspace-title">
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>Workspace <span aria-hidden="true">/</span> Brand operations</div>
          <div className={styles.topActions}>
            <span className={styles.previewPill}><span aria-hidden="true" /> Design preview</span>
          <span className={styles.topAvatar} aria-hidden="true">W</span>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.notice} role="note">
            <span className={styles.noticeIcon} aria-hidden="true">i</span>
            <p><strong>Code-first design handoff.</strong> Figma is deferred for this implementation pass by owner direction. No live API calls or business data are shown here.</p>
          </div>

          <section className={styles.intro}>
            <div>
              <p className={styles.eyebrow}>W2 · BRAND WORKSPACE</p>
              <h1 id="workspace-title">A clearer way to run your catalogue.</h1>
              <p className={styles.lede}>Create products at your pace, bring existing data in safely, and keep every review and stock change traceable.</p>
            </div>
            <a className={styles.primaryLink} href="#products">Explore the workspace <span aria-hidden="true">↘</span></a>
          </section>

          <section className={styles.journeyGrid} aria-label="Workspace areas">
            {journeys.map((journey) => (
              <a className={styles.journeyCard} key={journey.id} href={`#${journey.id}`}>
                <span className={styles.journeyNumber}>{journey.number}</span>
                <span className={styles.journeyLabel}>{journey.label}</span>
                <span className={styles.journeyDetail}>{journey.detail}</span>
                <span className={styles.arrow} aria-hidden="true">↗</span>
              </a>
            ))}
          </section>

          <section id="products" className={styles.featureSection} aria-labelledby="product-heading">
            <div className={styles.sectionHeading}>
              <div><p className={styles.eyebrow}>CATALOGUE</p><h2 id="product-heading">Start with what you have.</h2></div>
              <a href="#product-form" className={styles.secondaryLink}>Preview product setup <span aria-hidden="true">→</span></a>
            </div>
            <div className={styles.productPanel}>
              <div className={styles.productCopy}>
                <span className={styles.softIcon} aria-hidden="true">✳</span>
                <h3>Build a draft in small steps</h3>
                <p>Choose a category first. Add details now, then come back for variants, images, price and evidence when they’re ready.</p>
                <ul className={styles.stepList}>
                  <li><span>1</span><div><strong>Choose a category</strong><small>See the current fields for that category</small></div></li>
                  <li><span>2</span><div><strong>Save your draft</strong><small>Resume later without publishing</small></div></li>
                  <li><span>3</span><div><strong>Complete the details</strong><small>Know what is required before review</small></div></li>
                </ul>
              </div>
              <div id="product-form" className={styles.formCard}>
                <div className={styles.formTop}><span className={styles.formStep}>STEP 1 OF 3</span><span className={styles.formDraft}>Draft setup</span></div>
                <h3>Tell us the basics</h3>
                <p className={styles.formLead}>You can fill in the rest later.</p>
                <label className={styles.fieldLabel} htmlFor="product-name">Product name</label>
                <input id="product-name" disabled placeholder="e.g. Handwoven cotton shirt" />
                <label className={styles.fieldLabel} htmlFor="product-category">Category</label>
                <button id="product-category" className={styles.selectButton} type="button" disabled>Select a category <span aria-hidden="true">⌄</span></button>
                <div className={styles.formFooter}><span>Changes save to a draft.</span><button type="button" disabled>Continue <span aria-hidden="true">→</span></button></div>
                <p className={styles.previewCaption}>Non-interactive concept · no draft is created</p>
              </div>
            </div>
            <div className={styles.emptyStrip}><span className={styles.emptyDot} aria-hidden="true" /><p><strong>Your drafts will appear here.</strong> This preview does not load or store seller data.</p><span className={styles.mutedLabel}>NO LIVE DATA</span></div>
          </section>

          <section id="imports" className={styles.secondarySection} aria-labelledby="import-heading">
            <div className={styles.sectionHeading}>
              <div><p className={styles.eyebrow}>BULK CATALOGUE</p><h2 id="import-heading">Bring your catalogue across with confidence.</h2></div>
              <span className={styles.liveBadge}>CSV &amp; XLSX route registered</span>
            </div>
            <div className={styles.importFlow}>
              {[
                ["01", "Upload a file", "Private upload with file checks"],
                ["02", "Match columns", "Save a reusable field mapping"],
                ["03", "Review changes", "See row errors before confirming"],
                ["04", "Track results", "Retry failed rows without repeating successful ones"],
              ].map(([number, title, detail], index) => (
                <div className={styles.importStep} key={number}>
                  <span className={styles.importStepNumber}>{number}</span>
                  {index < 3 && <span className={styles.connector} aria-hidden="true" />}
                  <h3>{title}</h3><p>{detail}</p>
                </div>
              ))}
            </div>
            <div className={styles.importFootnote}><span aria-hidden="true">↳</span> A preview can become stale if a target changes. Confirmation must stop and ask for a new preview.</div>
          </section>

          <div className={styles.gatedGrid}>
            <section id="inventory" className={styles.gatedCard} aria-labelledby="inventory-heading">
              <div className={styles.cardHeading}><span className={styles.cardIcon} aria-hidden="true">▤</span><span className={styles.gatedTag}>GATED</span></div>
              <p className={styles.eyebrow}>STOCK CONTROL</p><h2 id="inventory-heading">Inventory you can trust.</h2>
              <p>Read stock from the backend ledger. Locations, receipts, observations and adjustments will appear after protected inventory routes are approved.</p>
              <div className={styles.stockLabels} aria-label="Stock buckets shown when connected"><span>Physical</span><span>Quarantined</span><span>Unavailable</span><span>Allocated</span><span>Buffered</span></div>
              <div className={styles.gateNotice}><strong>Unavailable in this preview</strong><span>Protected stock routes are not registered in the runtime API.</span><small>G05 · G06 · G07 · G08 · G16 · G17</small></div>
            </section>
            <section id="operations" className={styles.gatedCard} aria-labelledby="operations-heading">
              <div className={styles.cardHeading}><span className={styles.cardIcon} aria-hidden="true">◇</span><span className={styles.gatedTag}>GATED</span></div>
              <p className={styles.eyebrow}>RENIVET OPERATIONS</p><h2 id="operations-heading">Every decision, with its evidence.</h2>
              <p>Keep each decision tied to the exact product revision and its evidence. Review actions stay unavailable until the backend provides an authorized queue and review context.</p>
              <ul className={styles.reviewList}><li>Taxonomy version and rule changes</li><li>Price windows and independent decisions</li><li>Claim evidence and expiry</li><li>Frozen product revision and publication state</li></ul>
              <div className={styles.gateNotice}><strong>Review context is not available yet</strong><span>The API has no review queue or read-by-id evidence context. QC, publication and restriction routes are also not registered, so no decision action is shown.</span><small>G07 · G08 · G14 · G17</small></div>
            </section>
          </div>

          <footer className={styles.footer}><span>RENIVET · W2 PORTAL CONCEPT</span><span>Design handoff in progress</span></footer>
        </div>
      </main>
    </div>
  );
}
