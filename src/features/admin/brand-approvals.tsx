"use client";

import { useEffect, useState } from "react";
import { getCurrentSession, stepUpWithMfa } from "@/features/identity/auth-api";
import { shouldRequestMfaStepUp, type MfaEnforcementMode } from "@/features/identity/mfa-policy";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./brand-approvals.module.css";

type Application = {
  brandId: string;
  brandName?: string;
  legalName?: string;
  brandState?: string;
  submittedAt?: string;
  applicantUserId: string;
  applicantName?: string;
  applicantEmail?: string;
  membershipState?: string;
};

function errorText(error: unknown) {
  if (error instanceof W2ApiError && error.status === 403) return "Your account is not allowed to review brand applications.";
  if (error instanceof W2ApiError && error.status >= 500) return "Brand applications are temporarily unavailable. Try again shortly.";
  return error instanceof Error ? error.message : "Brand applications could not be loaded.";
}

export function BrandApprovals() {
  const [items, setItems] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [mfa, setMfa] = useState("");
  const [mfaEnforcementMode, setMfaEnforcementMode] = useState<MfaEnforcementMode>("enforced");
  const [mfaModeLoaded, setMfaModeLoaded] = useState(false);
  const [checker, setChecker] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    try {
      const result = await w2Request<{ items: Application[] }>(["admin", "brand-application-reviews"]);
      setItems(result.items ?? []);
    } catch (cause) { setError(errorText(cause)); }
  }

  useEffect(() => {
    void load();
    void getCurrentSession().then((session) => {
      setMfaEnforcementMode(session.mfaEnforcementMode);
      setMfaModeLoaded(true);
    }).catch(() => {
      setMfaEnforcementMode("enforced");
      setMfaModeLoaded(true);
    });
  }, []);

  async function decide(decision: "approved" | "rejected") {
    if (!selected) return;
    if (!/^[0-9a-f-]{36}$/i.test(checker)) { setError("Enter the independent checker’s user ID."); return; }
    setBusy(true); setError("");
    try {
      const session = await getCurrentSession();
      setMfaEnforcementMode(session.mfaEnforcementMode);
      setMfaModeLoaded(true);
      let csrfToken = session.csrfToken;
      if (shouldRequestMfaStepUp(session.mfaEnforcementMode)) {
        if (!/^\d{6}$/.test(mfa.trim())) throw new Error("Enter the six-digit MFA code.");
        const elevated = await stepUpWithMfa(mfa.trim(), session.csrfToken);
        csrfToken = elevated.csrfToken;
        setMfa("");
      }
      await w2Request(["admin", "brands", selected.brandId, "application-review"], {
        method: "POST",
        body: { applicantUserId: selected.applicantUserId, checkedByUserId: checker.trim(), decision, eventId: crypto.randomUUID() },
        csrfToken,
        idempotencyKey: crypto.randomUUID(),
      });
      setNotice(`Application ${decision}. The persisted queue is refreshing.`);
      setSelected(null);
      await load();
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }

  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.kicker}>PLATFORM ADMIN · BRAND APPROVALS</p><h1>Applications awaiting review</h1><p>Only persisted pending applications are shown. Approval activates the existing W1 brand membership handoff.</p></div><a href="/operations">Back to operations</a></header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.grid}>
      <div className={styles.panel}><div className={styles.panelHeading}><h2>Pending applications</h2><button className={styles.linkButton} onClick={() => void load()}>Refresh</button></div>
        {items.length === 0 ? <p className={styles.empty}>No persisted pending applications are available to this permission.</p> : <div className={styles.list}>{items.map((item) => <button className={styles.card} key={item.brandId} onClick={() => { setSelected(item); setError(""); }}><strong>{item.brandName ?? item.legalName ?? item.brandId}</strong><span>{item.applicantName ?? "Applicant"} · {item.applicantEmail ?? "redacted"}</span><small>{item.brandState} · membership {item.membershipState}</small></button>)}</div>}
      </div>
      <div className={styles.panel}><h2>Review detail</h2>
        {!selected ? <p className={styles.empty}>Select a persisted application to review.</p> : <div className={styles.form}>
          <dl><div><dt>Brand</dt><dd>{selected.brandName ?? selected.legalName}</dd></div><div><dt>Applicant</dt><dd>{selected.applicantName ?? selected.applicantUserId}</dd></div><div><dt>Submitted</dt><dd>{selected.submittedAt ?? "—"}</dd></div></dl>
          <label>Independent checker user ID<input value={checker} onChange={(event) => setChecker(event.target.value)} placeholder="UUID of a different reviewer" /></label>
          {mfaModeLoaded && shouldRequestMfaStepUp(mfaEnforcementMode) ? <label>Fresh MFA code<input value={mfa} onChange={(event) => setMfa(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label> : null}
          <div className={styles.actions}><button className={styles.approve} disabled={busy} onClick={() => void decide("approved")}>Approve application</button><button className={styles.reject} disabled={busy} onClick={() => void decide("rejected")}>Reject application</button></div>
          <p className={styles.muted}>Maker-checker is enforced by the backend; the submitter and checker cannot be the same person.</p>
        </div>}
      </div>
    </section>
  </main>;
}
