"use client";

import { useState } from "react";
import { getW2PermissionRows, getW2ReviewStates } from "./w2-review-prototype";
import styles from "./w2-review-prototype.module.css";

const states = getW2ReviewStates();
const permissions = getW2PermissionRows();

export function W2ReviewPrototype() {
  const [audience, setAudience] = useState<"Applicant" | "Reviewer">("Applicant");
  const [selectedId, setSelectedId] = useState("draft");
  const current = states.find(state => state.id === selectedId) ?? states[0];
  const options = states.filter(state => state.audience === audience);

  function chooseAudience(next: "Applicant" | "Reviewer") {
    setAudience(next);
    setSelectedId(states.find(state => state.audience === next)?.id ?? "draft");
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.wordmark} href="/" aria-label="Renivet home"><span className={styles.logoMark} aria-hidden="true">r.</span><span>renivet</span></a>
        <div className={styles.topbarRight}><span className={styles.waveBadge}><span aria-hidden="true" /> W2 · PRE-DESIGN</span><span className={styles.revision}>Concept 01</span></div>
      </header>

      <section className={styles.hero} aria-labelledby="title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Seller experience <span aria-hidden="true">/</span> REN2-18</p>
          <h1 id="title">A clear path<br />through <em>review.</em></h1>
          <p className={styles.lede}>A proposed application and review experience designed to keep people informed while sensitive evidence stays carefully protected.</p>
        </div>
        <aside className={styles.heroMeta} aria-label="Design status">
          <span className={styles.metaLabel}>Design status</span>
          <strong><span aria-hidden="true" /> Provisional</strong>
          <p>For product and security review. Not approved for build.</p>
          <div className={styles.metaDivider} />
          <span className={styles.metaLabel}>Based on</span>
          <p>W0.4 designer brief<br />W0.4 screen/state matrix<br />EXD-006 · T-AZ-09</p>
        </aside>
      </section>

      <div className={styles.notice} role="note">
        <span className={styles.noticeIcon} aria-hidden="true">i</span>
        <p><strong>Temporary in-code design preview.</strong> Figma and formal Product, Security and Admin Operations reviews are still required. This page stores no application data and performs no uploads, approvals or access checks.</p>
      </div>

      <section className={styles.explorer} aria-labelledby="explorer-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.sectionKicker}>01 <span>·</span> Explore the experience</p><h2 id="explorer-title">Two sides of one careful process.</h2></div>
          <div className={styles.audiencePicker} role="group" aria-label="Choose experience audience">
            {(["Applicant", "Reviewer"] as const).map(item => <button type="button" key={item} className={audience === item ? styles.audienceActive : styles.audienceButton} aria-pressed={audience === item} onClick={() => chooseAudience(item)}>{item === "Applicant" ? "Brand applicant" : "Admin reviewer"}</button>)}
          </div>
        </div>

        <div className={styles.experienceGrid}>
          <nav className={styles.stateRail} aria-label={`${audience} preview states`}>
            <div className={styles.railIntro}><span className={styles.railIcon} aria-hidden="true">{audience === "Applicant" ? "01" : "02"}</span><div><strong>{audience} journey</strong><small>{options.length} example states</small></div></div>
            <ol className={styles.stateList}>
              {options.map((state, index) => <li key={state.id}><button type="button" className={current.id === state.id ? styles.stateActive : styles.stateButton} aria-current={current.id === state.id ? "step" : undefined} onClick={() => setSelectedId(state.id)}><span className={styles.stateIndex}>{String(index + 1).padStart(2, "0")}</span><span className={styles.stateLabel}>{state.label}</span><span className={styles.stateArrow} aria-hidden="true">↗</span></button></li>)}
            </ol>
            <div className={styles.railFooter}><span className={styles.dot} aria-hidden="true" /> Proposed states · all open for review</div>
          </nav>

          <article className={styles.previewCard} aria-labelledby="screen-heading">
            <div className={styles.screenTopline}><span>{current.screenId}</span><span className={styles.stateTag}>{current.statusLabel}</span></div>
            <div className={styles.screenBody}>
              <div className={styles.screenBrand}><span className={styles.miniMark} aria-hidden="true">r.</span><span>renivet</span><span className={styles.contextLabel}>{audience === "Applicant" ? "BRAND ONBOARDING" : "REVIEW WORKSPACE"}</span></div>
              <div className={styles.screenContent}>
                <p className={styles.screenKicker}>{audience === "Applicant" ? "YOUR BRAND APPLICATION" : "RESTRICTED REVIEW"}</p>
                <h3 id="screen-heading">{current.heading}</h3>
                <p className={styles.screenDescription}>{current.description}</p>
                {audience === "Applicant" ? <ApplicantIllustration stateId={current.id} /> : <ReviewerIllustration stateId={current.id} />}
                <div className={styles.detailBox}><span className={styles.detailIcon} aria-hidden="true">i</span><p>{current.detail}</p></div>
                <button className={styles.previewAction} type="button" disabled aria-disabled="true">{current.primaryAction}<span aria-hidden="true">→</span></button>
                <p className={styles.disabledNote}>Preview only · action unavailable</p>
              </div>
            </div>
            <div className={styles.previewFoot}><span>State {String(options.findIndex(item => item.id === current.id) + 1).padStart(2, "0")} of {String(options.length).padStart(2, "0")}</span><span>Illustrative copy · status is not live</span></div>
          </article>

          <aside className={styles.annotation} aria-label="Design annotations">
            <p className={styles.annotationKicker}>Design intent</p>
            <h3>{audience === "Applicant" ? "Keep the next step visible." : "Make privileged review deliberate."}</h3>
            <ul className={styles.intentList}>
              {(audience === "Applicant" ? [
                ["01", "One clear action", "Explain the next step in plain language."],
                ["02", "Honest status", "Show a decision only after the service confirms it."],
                ["03", "No evidence surprises", "Field and document requirements stay TBD until approved."],
              ] : [
                ["01", "Server decides access", "Role and brand scope come from current membership."],
                ["02", "Verify before review", "Use recent MFA for privileged steps when required."],
                ["03", "Leave an audit trail", "Record decisions only through an authorized service."],
              ]).map(([number, title, copy]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><small>{copy}</small></div></li>)}
            </ul>
            <div className={styles.currentRule}><span className={current.ruleStatus === "TBD" ? styles.tbdBadge : styles.boundaryBadge}>{current.ruleStatus === "TBD" ? "OPEN DECISION" : "SECURITY BOUNDARY"}</span><p>{current.ruleStatus === "TBD" ? "This screen reflects a proposed workflow. Confirm the policy before treating it as a requirement." : "These access safeguards are design constraints; the backend must enforce them."}</p></div>
          </aside>
        </div>
      </section>

      <section className={styles.matrixSection} aria-labelledby="matrix-title">
        <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>02 <span>·</span> Permissions &amp; open decisions</p><h2 id="matrix-title">What’s settled. What still needs a decision.</h2></div><p className={styles.matrixIntro}>The preview separates known security boundaries from workflow details that need Product, Security and Admin Operations review.</p></div>
        <div className={styles.tableWrap}>
          <table className={styles.matrix}>
            <thead><tr><th scope="col">Who</th><th scope="col">Rule or decision</th><th scope="col">Status</th><th scope="col">Source / owner</th></tr></thead>
            <tbody>{permissions.map((row, index) => <tr key={`${row.audience}-${index}`}><td><span className={styles.persona}>{row.audience}</span></td><td>{row.rule}</td><td><span className={row.status === "TBD" ? styles.tbdBadge : styles.confirmedBadge}><span aria-hidden="true">{row.status === "TBD" ? "○" : "✓"}</span>{row.status}</span></td><td className={styles.sourceCell}>{row.source}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.safeguardSection} aria-labelledby="safeguards-title">
        <div><p className={styles.sectionKicker}>03 <span>·</span> Privacy by default</p><h2 id="safeguards-title">Sensitive information<br /><em>stays protected.</em></h2></div>
        <div className={styles.safeguardCards}>
          <article><span className={styles.safeguardNumber}>01</span><h3>Evidence is never public</h3><p>No direct file links or document previews. Access must be checked by the service for the current reviewer and scope.</p></article>
          <article><span className={styles.safeguardNumber}>02</span><h3>Bank details stay masked</h3><p>Only the minimum approved detail should be visible. Real bank or identity data is not used in this design preview.</p></article>
          <article><span className={styles.safeguardNumber}>03</span><h3>Decisions are accountable</h3><p>Privileged actions require authorized access, recent MFA when required, and a server-recorded audit event.</p></article>
        </div>
      </section>

      <section className={styles.reviewSection} aria-labelledby="review-title">
        <div><p className={styles.sectionKicker}>04 <span>·</span> Before this can move forward</p><h2 id="review-title">Review is part of the design.</h2></div>
        <div className={styles.reviewSteps}>
          {[ ["01", "Product", "Confirm fields, statuses and allowed transitions."], ["02", "Security & Privacy", "Review evidence handling, reviewer access and audit."], ["03", "Admin Operations", "Confirm queue, reviewer handoff and decision steps."], ["04", "Figma", "Create the versioned, editable source-of-truth prototype." ] ].map(([number, title, description]) => <div className={styles.reviewStep} key={number}><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div><span className={styles.pending}>Pending</span></div>)}
        </div>
      </section>

      <footer className={styles.footer}><span><span className={styles.logoMarkSmall}>r.</span> RENIVET · W2 PRE-DESIGN</span><span>REN2-18 · Figma handoff and signoff pending</span></footer>
    </main>
  );
}

function ApplicantIllustration({ stateId }: { stateId: string }) {
  if (stateId === "scan-failed") return <div className={styles.uploadCard}><span className={styles.fileIcon} aria-hidden="true">↥</span><div><strong>Evidence file</strong><small>Preview placeholder · no file attached</small></div><span className={styles.fileStatus}>Unable to check</span></div>;
  if (stateId === "submitted" || stateId === "pending" || stateId === "needs-changes" || stateId === "approved" || stateId === "rejected" || stateId === "suspended") return <div className={styles.timeline}><span className={styles.timelineLine} /><div className={styles.timelineItem}><span className={styles.timelineDotActive} /><div><strong>Application received</strong><small>Status shown only after service confirmation</small></div><span className={styles.timelineStatus}>{stateId === "submitted" ? "Now" : "Recorded"}</span></div><div className={styles.timelineItem}><span className={styles.timelineDot} /><div><strong>Review outcome</strong><small>Timing and transitions are not yet approved</small></div><span className={styles.timelineStatusMuted}>Pending</span></div></div>;
  return <div className={styles.formPreview}><div className={styles.fieldPreview}><span>Brand details</span><div><span className={styles.fieldLine} /><span className={styles.fieldLineShort} /></div><small>Example fields · final list TBD</small></div><div className={styles.fieldPreview}><span>Supporting evidence</span><div className={styles.evidencePlaceholder}><span aria-hidden="true">＋</span> Requirements not approved</div><small>Do not collect sensitive evidence until policy is approved</small></div></div>;
}

function ReviewerIllustration({ stateId }: { stateId: string }) {
  if (stateId === "queue-empty") return <div className={styles.emptyQueue}><span aria-hidden="true">✓</span><strong>Queue clear</strong><p>A future service response confirms there are no items in this reviewer’s scope.</p></div>;
  if (stateId === "mfa-required") return <div className={styles.mfaCard}><span className={styles.lockIcon} aria-hidden="true">⌑</span><strong>Verify your identity</strong><p>Your session needs another verification step before this restricted action.</p><div className={styles.mfaCode}><span>•</span><span>•</span><span>•</span><span>•</span><span>•</span><span>•</span></div></div>;
  if (stateId === "denied") return <div className={styles.deniedCard}><span className={styles.deniedIcon} aria-hidden="true">↗</span><div><strong>Review unavailable</strong><p>Access could not be confirmed. No application details are shown.</p></div></div>;
  return <div className={styles.reviewRecord}><div className={styles.recordHeader}><div><span className={styles.recordOverline}>APPLICATION REFERENCE</span><strong>•••• · demo only</strong></div><span className={styles.recordPill}>{stateId === "review-error" ? "Unavailable" : stateId === "reviewer-conflict" ? "Decision paused" : "Access checked by service"}</span></div><div className={styles.recordRow}><span>Brand identity</span><strong>Restricted until authorized</strong></div><div className={styles.recordRow}><span>Evidence</span><strong>{stateId === "evidence-restricted" ? "No document preview" : "Not loaded in this preview"}</strong></div><div className={styles.recordRow}><span>Decision</span><strong>Not submitted</strong></div></div>;
}
