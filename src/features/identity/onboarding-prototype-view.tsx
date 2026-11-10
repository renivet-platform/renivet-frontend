"use client";

import { useState } from "react";
import {
  getOnboardingPrototypeScreens,
  getPrototypeStateCopy,
  type PrototypeState,
} from "./onboarding-prototype";
import styles from "./onboarding-prototype.module.css";

const screens = getOnboardingPrototypeScreens();

export function OnboardingPrototype() {
  const [screenIndex, setScreenIndex] = useState(0);
  const screen = screens[screenIndex];
  const [state, setState] = useState<PrototypeState>(screen.states[0]);
  const stateCopy = getPrototypeStateCopy(state);
  const isError = ["validation-error", "recoverable-error", "denied", "expired", "service-unavailable", "invalid-code", "already-used", "rate-limited", "suspended", "audit-unavailable"].includes(state);
  const nextIndex = screen.nextStepId ? screens.findIndex(item => item.id === screen.nextStepId) : -1;
  const alternateIndex = screen.alternateStepId ? screens.findIndex(item => item.id === screen.alternateStepId) : -1;

  function selectScreen(index: number) {
    setScreenIndex(index);
    setState(screens[index].states[0]);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.wordmark} href="/" aria-label="Renivet home">
          <span className={styles.mark} aria-hidden="true">R</span>
          <span>renivet</span>
        </a>
        <span className={styles.previewTag}><span aria-hidden="true" /> Design preview · W1</span>
      </header>

      <section className={styles.intro} aria-labelledby="page-title">
        <p className={styles.kicker}>Identity &amp; seller access · review draft</p>
        <h1 id="page-title">A considered start.<br /><em>Confidence at every step.</em></h1>
        <p className={styles.introCopy}>
          A proposed first-wave experience for customers, brand teams and administrators. Choose a screen, then explore a safe state.
        </p>
      </section>

      <div className={styles.reviewNotice} role="note">
        <span className={styles.noticeIcon} aria-hidden="true">i</span>
        <p><strong>Provisional design preview.</strong> This is an in-code review provision while Figma is unavailable. Figma and formal signoff will follow; no credentials, access decisions or real records are processed here.</p>
      </div>

      <div className={styles.workspace}>
        <nav className={styles.screenNav} aria-label="W1 screen previews">
          <p className={styles.navHeading}>The journey</p>
          <p className={styles.navSubheading}>Select a screen</p>
          <ol className={styles.screenList}>
            {screens.map((item, index) => (
              <li key={`${item.sourceId}-${item.title}`}>
                <button className={index === screenIndex ? styles.screenButtonActive : styles.screenButton}
                  type="button" aria-current={index === screenIndex ? "step" : undefined}
                  onClick={() => selectScreen(index)}>
                  <span className={styles.screenNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.screenButtonCopy}><strong>{item.title}</strong><small>{item.sourceId} · {item.audience}</small></span>
                </button>
              </li>
            ))}
          </ol>
          <div className={styles.navFooter}>
            <span className={styles.proposedDot} aria-hidden="true" />
            <span>Every screen is proposed<br />and open for review</span>
          </div>
        </nav>

        <section className={styles.canvas} aria-labelledby="screen-title">
          <div className={styles.canvasMeta}>
            <span>{screen.sourceId} <span aria-hidden="true">/</span> {screen.stage}</span>
            <span className={styles.reviewState}>Proposed</span>
          </div>

          <div className={styles.previewFrame}>
            <div className={styles.frameHeader}>
              <span className={styles.wordmarkSmall}><span className={styles.markSmall} aria-hidden="true">R</span> renivet</span>
              <span className={styles.frameAudience}>{screen.audience} access</span>
            </div>

            <div className={styles.formPanel}>
              <div className={styles.frameEyebrow}><span className={styles.eyebrowLine} />{screen.eyebrow}</div>
              <h2 id="screen-title" aria-live="polite" aria-atomic="true">{screen.heading}</h2>
              <p className={styles.screenDescription}>{screen.description}</p>

              {screen.fields.length > 0 ? (
                <div className={styles.fields}>
                  {screen.fields.map(field => (
                    <label className={styles.field} key={field.label}>
                      <span>{field.label}</span>
                      <input type={field.type} placeholder={field.placeholder} readOnly aria-readonly="true" />
                    </label>
                  ))}
                </div>
              ) : (
                <div className={styles.accessCard}>
                  <span className={styles.accessIcon} aria-hidden="true">↗</span>
                  <div><strong>{state === "empty" ? "No active access to show" : state === "denied" ? "This area is restricted" : "Access is checked securely"}</strong>
                    <p>Brand names, staff records and protected details stay hidden until the service confirms permission.</p></div>
                </div>
              )}

              <div className={isError ? styles.stateMessageError : styles.stateMessage} role="status" aria-live="polite" aria-atomic="true">
                <span className={styles.stateIcon} aria-hidden="true">{isError ? "!" : "✓"}</span>
                <span><strong>{stateCopy.label}</strong><small>{stateCopy.message}</small></span>
              </div>

              <button className={styles.primaryAction} type="button" onClick={() => selectScreen(nextIndex)} disabled={nextIndex < 0}>
                {nextIndex < 0 ? "End of preview" : "Preview next"}<span aria-hidden="true">&rarr;</span>
              </button>
              {alternateIndex >= 0 && <button className={styles.secondaryAction} type="button" onClick={() => selectScreen(alternateIndex)}>{screen.secondaryAction || `Preview ${screens[alternateIndex].title.toLowerCase()}`}</button>}
              <p className={styles.previewOnly}>Preview only. Buttons navigate between proposed screens; no information is submitted.</p>
            </div>
          </div>

          <fieldset className={styles.statePicker}>
            <legend>Explore a screen state</legend>
            <div className={styles.stateOptions}>
              {screen.states.map(option => {
                const label = getPrototypeStateCopy(option).label;
                return <button key={option} className={option === state ? styles.stateOptionActive : styles.stateOption}
                  type="button" aria-pressed={option === state} onClick={() => setState(option)}>{label}</button>;
              })}
            </div>
          </fieldset>
        </section>

        <aside className={styles.reviewPanel} aria-label="Design and review notes">
          <p className={styles.panelKicker}>Design principles</p>
          <h2>Simple to use.<br />Careful by design.</h2>
          <ul className={styles.principles}>
            <li><span>01</span><div><strong>Clear next steps</strong><small>Plain language, visible labels and calm guidance.</small></div></li>
            <li><span>02</span><div><strong>Privacy by default</strong><small>Neutral errors; no account or brand existence leaks.</small></div></li>
            <li><span>03</span><div><strong>Server-confirmed access</strong><small>Roles and permissions never come from the screen.</small></div></li>
          </ul>
          <div className={styles.checklist}>
            <p className={styles.panelKicker}>Review before approval</p>
            <ul>
              <li><span aria-hidden="true">○</span> Product &amp; Design</li>
              <li><span aria-hidden="true">○</span> Security &amp; Privacy</li>
              <li><span aria-hidden="true">○</span> Accessibility</li>
              <li><span aria-hidden="true">○</span> Frontend engineering</li>
            </ul>
            <p className={styles.reviewPending}>Reviews not yet recorded</p>
          </div>
          <p className={styles.sourceNote}>Scope: W1 · CU-08, CU-09, SE-20, AD-01, AD-06</p>
        </aside>
      </div>

      <footer className={styles.footer}>
        <span>Renivet · W0.4 design provision</span>
        <span>Figma source and approvals: planned follow-up</span>
      </footer>
    </main>
  );
}
