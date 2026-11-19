"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentSession, stepUpWithMfa } from "@/features/identity/auth-api";
import { shouldRequestMfaStepUp, type MfaEnforcementMode } from "@/features/identity/mfa-policy";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import { brandApprovalDetailPath, findPendingBrandApplication } from "./brand-approval-route";
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

export function BrandApprovals({ detailBrandId }: { detailBrandId?: string }) {
  const [items, setItems] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [mfa, setMfa] = useState("");
  const [mfaEnforcementMode, setMfaEnforcementMode] = useState<MfaEnforcementMode>("enforced");
  const [mfaModeLoaded, setMfaModeLoaded] = useState(false);
  const [checker, setChecker] = useState("");
  const [reviewers, setReviewers] = useState<Array<{id:string;name:string}>>([]);
  const [signedInReviewerId, setSignedInReviewerId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load({ resolveDetail = true }: { resolveDetail?: boolean } = {}) {
    setLoading(true);
    setError("");
    try {
      const result = await w2Request<{ items: Application[] }>(["admin", "brand-application-reviews"]);
      const pending = result.items ?? [];
      setItems(pending);
      if (detailBrandId && resolveDetail) {
        const application = findPendingBrandApplication(pending, detailBrandId);
        setSelected(application);
        if (!application) setError("This pending application is unavailable or no longer awaiting review.");
      }
    } catch (cause) { setError(errorText(cause)); setSelected(null); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void load();
    void w2Request<{items:Array<{id:string;name:string}>}>(["admin","brand-application-reviews","reviewers"])
      .then(data=>setReviewers(data.items??[])).catch(()=>setReviewers([]));
    void getCurrentSession().then((session) => {
      setSignedInReviewerId(session.user.id);
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
      await load({ resolveDetail: false });
      setNotice(`Application ${decision}. The persisted queue has been refreshed.`);
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }

  // AD-03 shows the oldest valid persisted applications first. Null dates are
  // left at the end; never turn missing W2 evidence/reviewer fields into data.
  const ordered = [...items].sort((left, right) => {
    const a = left.submittedAt ? Date.parse(left.submittedAt) : Number.POSITIVE_INFINITY;
    const b = right.submittedAt ? Date.parse(right.submittedAt) : Number.POSITIVE_INFINITY;
    return (Number.isFinite(a) ? a : Number.POSITIVE_INFINITY) - (Number.isFinite(b) ? b : Number.POSITIVE_INFINITY);
  });

  return <main className={styles.page} data-screen-id={detailBrandId ? "AD-04" : "AD-03"}>
    <header className={styles.header}><div><p className={styles.kicker}>PLATFORM ADMIN · BRAND APPROVALS</p><h1>{detailBrandId ? "Review brand application" : "Brand applications"}</h1><p>{detailBrandId ? "Only persisted pending applications can be reviewed; missing W2 evidence must not be assumed verified." : "Oldest submitted applications first. Check the persisted details before deciding."}</p></div><Link href={detailBrandId ? "/brand-approvals" : "/operations"}>{detailBrandId ? "Back to applications" : "Back to operations"}</Link></header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {detailBrandId && <div className={styles.reviewContext} role="note">
      <strong>Independent application review</strong>
      <p>Only persisted W1 eligibility and membership data can be approved here. Business documents, finance evidence, correction notes and the W2 application revision still require approved backend contracts; do not infer verification from this decision.</p>
    </div>}
    {!detailBrandId && <section className={styles.applicationTable} aria-label="Persisted brand application review queue">
      <div className={styles.tableHeading}><h2>Brand applications</h2><button type="button" className={styles.linkButton} onClick={() => void load()} disabled={loading}>Refresh</button></div>
      {loading ? <p className={styles.empty} role="status">Loading pending brand applications…</p>
        : ordered.length === 0 ? <p className={styles.empty}>No persisted pending applications are available to this permission.</p>
        : <div className={styles.tableWrap}>
          <table><caption className={styles.visuallyHidden}>Pending applications from authorized backend queue, oldest submitted first</caption>
            <thead><tr><th scope="col">Brand</th><th scope="col">Submitted</th><th scope="col">Documents</th><th scope="col">Status</th><th scope="col">Reviewer</th><th scope="col">Action</th></tr></thead>
            <tbody>{ordered.map(item => {
              const href = brandApprovalDetailPath(item.brandId);
              return <tr key={item.brandId}>
                <th scope="row"><strong>{item.brandName ?? item.legalName ?? item.brandId}</strong><small>{item.applicantName ?? "Applicant name not provided"}</small></th>
                <td data-label="Submitted">{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"}) : "Not recorded"}</td>
                <td data-label="Documents"><span className={styles.pendingEvidence}>Not supplied by W1 API</span></td>
                <td data-label="Status">{item.brandState?.replaceAll("_"," ").toLocaleLowerCase() ?? "State not supplied"}</td>
                <td data-label="Reviewer">Not supplied by API</td>
                <td data-label="Action">{href ? <Link href={href} className={styles.reviewLink}>Review</Link> : "Unavailable"}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      <p className={styles.queueNote}>Document verification, assigned reviewer and detailed corrections are not included in the current W1 queue API. The design does not invent them.</p>
    </section>}
    {detailBrandId && <section className={styles.grid}>
      <div className={styles.panel}><div className={styles.panelHeading}><h2>Pending applications</h2><button className={styles.linkButton} onClick={() => void load()}>Refresh</button></div>
        {loading ? <p className={styles.empty} role="status">Loading pending applications…</p> : items.length === 0 ? <p className={styles.empty}>No persisted pending applications are available to this permission.</p> : <div className={styles.list}>{items.map((item) => {
          const href = brandApprovalDetailPath(item.brandId);
          return href ? <Link className={styles.card} href={href} key={item.brandId} aria-current={selected?.brandId === item.brandId ? "page" : undefined}><strong>{item.brandName ?? item.legalName ?? item.brandId}</strong><span>{item.applicantName ?? "Applicant"} · {item.applicantEmail ?? "redacted"}</span><small>{item.brandState} · membership {item.membershipState}</small><span className={styles.cardAction}>Open application review</span></Link> : null;
        })}</div>}
      </div>
      <div className={styles.panel}><h2>Review detail</h2>
        {loading ? <p className={styles.empty} role="status">Loading application details…</p> : !selected ? <p className={styles.empty}>{notice ? "The recorded decision is complete. Return to the application list to continue reviewing." : detailBrandId ? "This application is unavailable or no longer awaiting review." : "Open a persisted application to review its current details."}</p> : <div className={styles.form}>
          <dl><div><dt>Brand</dt><dd>{selected.brandName ?? selected.legalName}</dd></div><div><dt>Applicant</dt><dd>{selected.applicantName ?? selected.applicantUserId}</dd></div><div><dt>Submitted</dt><dd>{selected.submittedAt ?? "—"}</dd></div></dl>
          <section className={styles.evidencePanel} aria-labelledby="application-evidence-heading"><p className={styles.kicker}>APPLICATION EVIDENCE</p><h3 id="application-evidence-heading">Documents and verification</h3><p>The current review record includes basic eligibility and membership details only. The evidence API does not provide uploaded documents, bank verification, correction requests, or review reasons.</p><ul><li><span>Business registration</span><strong>Not available</strong></li><li><span>Brand authorisation</span><strong>Not available</strong></li><li><span>Signatory identity</span><strong>Not available</strong></li><li><span>Bank verification</span><strong>Not available</strong></li></ul></section>
          <label>Independent reviewer<select value={checker} onChange={event=>setChecker(event.currentTarget.value)}>
            <option value="">Choose another authorized reviewer</option>
            {reviewers.filter(r=>r.id!==signedInReviewerId&&r.id!==selected.applicantUserId).map(reviewer=><option key={reviewer.id} value={reviewer.id}>{reviewer.name}</option>)}
          </select></label>
          {reviewers.filter(r=>r.id!==signedInReviewerId&&r.id!==selected.applicantUserId).length===0 && <p className={styles.muted}>No independent verified reviewer is available. Ask another Renivet admin to be assigned before proceeding.</p>}
          {mfaModeLoaded && shouldRequestMfaStepUp(mfaEnforcementMode) ? <label>Fresh MFA code<input value={mfa} onChange={(event) => setMfa(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label> : null}
          <div className={styles.actions}><button className={styles.approve} disabled={busy} onClick={() => void decide("approved")}>Approve application</button><button className={styles.reject} disabled={busy} onClick={() => void decide("rejected")}>Reject application</button></div>
          <p className={styles.muted}>Maker-checker is enforced by the backend; the submitter and checker cannot be the same person. This W1 decision records approve or reject only; it does not attest that the unavailable W2 evidence was checked.</p>
        </div>}
      </div>
    </section>}
  </main>;
}
