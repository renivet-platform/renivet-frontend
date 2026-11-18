"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./seller-application-screen.module.css";

const steps = ["Business details", "Brand profile", "Documents", "Payout account", "Review & submit"] as const;
type FormState = { legalName: string; entityType: string; gstin: string; pan: string; address: string; email: string; brandName: string; website: string; story: string };
const empty: FormState = { legalName: "", entityType: "", gstin: "", pan: "", address: "", email: "", brandName: "", website: "", story: "" };

export function SellerApplicationScreen() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const current = steps[step];
  const canContinue = step === 0 ? Boolean(form.legalName.trim() && form.entityType && form.email.trim()) : step === 1 ? Boolean(form.brandName.trim() && form.story.trim()) : true;

  function update(field: keyof FormState, value: string) { setForm((state) => ({ ...state, [field]: value })); }
  function field(label: string, key: keyof FormState, options: { type?: string; hint?: string; placeholder?: string } = {}) {
    const id = `application-${key}`;
    return <label className={styles.field} htmlFor={id} key={key}>{label}{options.hint && <small>{options.hint}</small>}<input id={id} type={options.type ?? "text"} value={form[key]} placeholder={options.placeholder} onChange={(event) => update(key, event.currentTarget.value)} /></label>;
  }

  return <main className={styles.page} data-screen-id="SE-02" aria-labelledby="application-title">
    <header className={styles.topbar}><Link href="/" className={styles.wordmark}>RENIVET</Link><nav aria-label="Brand workspace"><Link href="/brands">Your brands</Link><span aria-hidden="true">/</span><span>Application</span></nav><span className={styles.preview} role="status">Design preview · not saved</span></header>
    <div className={styles.shell}>
      <aside className={styles.sidebar}><span className={styles.brandMark} aria-hidden="true">R</span><p className={styles.kicker}>BRAND WORKSPACE</p><strong>New application</strong><Link href="/brands">Switch brand</Link></aside>
      <div className={styles.mainContent}>
        <div className={styles.breadcrumb}><Link href="/brands">Your brands</Link><span>/</span><span>Application</span><span>/</span><span>{current}</span></div>
        <header className={styles.heading}><p className={styles.kicker}>SELLER APPLICATION · STEP {step + 1} OF {steps.length}</p><h1 id="application-title">Apply to sell on Renivet</h1><p>Enter business and brand information to preview the five-step application. There is no save or submit API yet; do not enter sensitive information in this demonstration.</p></header>
        <ol className={styles.stepper} aria-label="Application steps">{steps.map((label, index) => <li key={label} className={index === step ? styles.activeStep : index < step ? styles.doneStep : ""} aria-current={index === step ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
        <section className={styles.panel} aria-labelledby="step-title">
          <div className={styles.panelHeading}><div><p className={styles.kicker}>APPLICATION DETAILS</p><h2 id="step-title">{current}</h2></div><span className={styles.stepCount}>{step + 1} / {steps.length}</span></div>
          {step === 0 && <div className={styles.fields}>
            {field("Legal business name", "legalName", { placeholder: "As shown on GST and PAN documents" })}
            <label className={styles.field} htmlFor="application-entity">Type of business<select id="application-entity" value={form.entityType} onChange={(event) => update("entityType", event.currentTarget.value)}><option value="">Choose a business type</option><option>Proprietorship</option><option>Partnership</option><option>LLP</option><option>Company</option></select></label>
            <div className={styles.twoFields}>{field("GSTIN", "gstin", { hint: "Optional only if GST-exempt", placeholder: "15 characters" })}{field("PAN of the business", "pan", { placeholder: "10 characters" })}</div>
            {field("Registered address", "address", { placeholder: "Business address" })}
            {field("Business email", "email", { type: "email", hint: "Used for application updates", placeholder: "name@business.in" })}
          </div>}
          {step === 1 && <div className={styles.fields}>
            {field("Brand name", "brandName", { placeholder: "Name customers will see" })}
            {field("Website or social profile", "website", { type: "url", hint: "Optional", placeholder: "https://" })}
            <label className={styles.field} htmlFor="application-story">Tell us about the brand<small>Describe your materials, craft and the people who make the pieces.</small><textarea id="application-story" rows={5} value={form.story} onChange={(event) => update("story", event.currentTarget.value)} placeholder="Write a short brand story" /></label>
          </div>}
          {step === 2 && <div className={styles.documentList}><p className={styles.panelIntro}>Documents will be uploaded privately once Renivet’s secure application service is connected.</p>{["GST registration or exemption declaration", "PAN of the business", "Trademark certificate or brand authorisation", "Authorised signatory ID"].map((name) => <div className={styles.documentRow} key={name}><span><strong>{name}</strong><small>Accepted formats and size limits will appear here.</small></span><button type="button" disabled>Upload unavailable</button></div>)}</div>}
          {step === 3 && <div className={styles.payoutNotice}><span className={styles.payoutIcon} aria-hidden="true">₹</span><h3>Payout account</h3><p>Do not enter bank details here. Payout account setup and independent verification are not connected.</p><p>Renivet will show only masked account details after an approved secure payout flow is available.</p></div>}
          {step === 4 && <div className={styles.review}><h3>Review your details</h3><dl><div><dt>Legal business name</dt><dd>{form.legalName || "Not provided"}</dd></div><div><dt>Business type</dt><dd>{form.entityType || "Not provided"}</dd></div><div><dt>Brand name</dt><dd>{form.brandName || "Not provided"}</dd></div><div><dt>Business email</dt><dd>{form.email || "Not provided"}</dd></div></dl><p className={styles.notice}>This application preview is held only in this page. No application has been saved or submitted.</p><button className={styles.primary} type="button" disabled>Submit application unavailable</button></div>}
          <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>Back</button><button type="button" className={styles.secondary} disabled>Save for later</button>{step < steps.length - 1 && <button type="button" className={styles.primary} onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} disabled={!canContinue}>Continue</button>}</div>
        </section>
        <p className={styles.privacyNote}>Application fields are not sent to Renivet from this screen. <Link href="/brands/join">Leave application</Link></p>
      </div>
    </div>
  </main>;
}
