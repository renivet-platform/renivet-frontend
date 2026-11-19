"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthApiError, getCurrentSession, logoutCurrentSession, stepUpWithMfa } from "@/features/identity/auth-api";
import { shouldRequestMfaStepUp, type MfaEnforcementMode } from "@/features/identity/mfa-policy";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import type { components } from "@/generated/renivet-api";
import styles from "./operations-console.module.css";
import { reviewQueuePath, type AdminReviewQueue } from "./admin-route-utils";

type QueueId = AdminReviewQueue;
type ReviewItem = components["schemas"]["AdminReviewItemDto"] & Record<string, unknown>;
type ReviewPage = Omit<components["schemas"]["AdminReviewQueueResponseDto"], "items"> & { items: ReviewItem[] };
const queues: Array<{ id: QueueId; title: string; description: string; permission: string }> = [
  { id: "taxonomy", title: "Taxonomy", description: "Draft category schemas awaiting independent publication.", permission: "taxonomy.approve" },
  { id: "quality", title: "Product QC", description: "Submitted frozen product revisions awaiting a separate reviewer.", permission: "catalog.review" },
  { id: "pricing", title: "Pricing", description: "Pending price proposals and effective windows.", permission: "pricing.approve" },
  { id: "claims", title: "Sustainability claims", description: "Pending claims with evidence status and expiry metadata.", permission: "catalog.review" },
  { id: "publishing", title: "Publishing", description: "Exact approved revisions ready to publish, restrict or unpublish.", permission: "catalog.publish / catalog.restrict" },
];

function itemId(queue: QueueId, item: ReviewItem): string | null {
  const key = queue === "taxonomy" ? "revisionId" : queue === "quality" ? "revisionId" : queue === "pricing" ? "priceId" : queue === "claims" ? "claimId" : "productId";
  return typeof item[key] === "string" ? item[key] as string : null;
}
function display(value: unknown): string { return typeof value === "string" || typeof value === "number" ? String(value) : "—"; }
function errorMessage(error: unknown): string {
  const status = error instanceof W2ApiError || error instanceof AuthApiError ? error.status : 0;
  if (status === 401) return "Your session has expired. Sign in again to continue.";
  if (status === 403) return "Your account does not have the global admin permission for this review queue.";
  if (status === 404) return "This review item is no longer pending or available.";
  if (status === 409 || status === 412) return "This item changed while you were reviewing it. Reload the queue before deciding.";
  if (status === 503 || status === 0) return "Review data is temporarily unavailable. Try again shortly.";
  return error instanceof Error ? error.message : "The review request could not be completed.";
}

export { isQueueId, reviewQueuePath } from "./admin-route-utils";

export function AdminOperationsConsole({ initialQueue = "quality", initialItemId }: { initialQueue?: QueueId; initialItemId?: string } = {}) {
  const router = useRouter();
  const [active, setActive] = useState<QueueId>(initialQueue);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionCsrfToken, setSessionCsrfToken] = useState("");
  const [mfaEnforcementMode, setMfaEnforcementMode] = useState<MfaEnforcementMode>("enforced");
  const [sessionError, setSessionError] = useState("");
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [queueError, setQueueError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [confirmedRevision, setConfirmedRevision] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");
  const queueRequest = useRef(0);
  const detailRequest = useRef(0);
  const area = useMemo(() => queues.find((queue) => queue.id === active)!, [active]);

  const loadQueue = useCallback(async (queue: QueueId) => {
    const requestId = ++queueRequest.current;
    detailRequest.current += 1;
    setLoading(true); setQueueError(""); setSelected(null); setConfirmedRevision(false); setDetailError("");
    try {
      const page = await w2Request<ReviewPage>(["admin", "reviews", queue], { query: { limit: "100" } });
      if (requestId === queueRequest.current) setItems(Array.isArray(page.items) ? page.items : []);
    } catch (error) { if (requestId === queueRequest.current) { setItems([]); setQueueError(errorMessage(error)); } }
    finally { if (requestId === queueRequest.current) setLoading(false); }
  }, []);

  useEffect(() => {
    let live = true;
    getCurrentSession().then((session) => { if (live) { setSessionReady(true); setSessionUserId(session.user.id); setSessionCsrfToken(session.csrfToken); setMfaEnforcementMode(session.mfaEnforcementMode); setSessionError(""); } })
      .catch((error: unknown) => { if (live) setSessionError(errorMessage(error)); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    setActive(initialQueue);
    setSelected(null);
    setConfirmedRevision(false);
    setDetailError("");
    setNotice("");
  }, [initialQueue]);

  useEffect(() => { if (sessionReady) void loadQueue(active); }, [active, loadQueue, sessionReady]);

  useEffect(() => {
    if (!sessionReady || !initialItemId || !items.length) return;
    const item = items.find((candidate) => itemId(active, candidate) === initialItemId);
    if (item) void openItem(item);
  }, [active, initialItemId, items, sessionReady]);

  async function openItem(item: ReviewItem) {
    const requestId = ++detailRequest.current;
    const id = itemId(active, item);
    if (!id) { setDetailError("The queue returned an invalid review reference."); return; }
    setSelected(null); setConfirmedRevision(false); setDetailError(""); setNotice("");
    router.replace(reviewQueuePath(active, id));
    try { const value = await w2Request<ReviewItem>(["admin", "reviews", active, id]); if (requestId === detailRequest.current) setSelected(value); }
    catch (error) { if (requestId === detailRequest.current) setDetailError(errorMessage(error)); }
  }

  async function signOut() {
    if (signOutBusy || !sessionCsrfToken) return;
    setSignOutBusy(true); setSessionError("");
    try { await logoutCurrentSession(sessionCsrfToken); router.replace("/sign-in"); router.refresh(); }
    catch (error) { setSessionError(errorMessage(error)); }
    finally { setSignOutBusy(false); }
  }

  async function decide(decision: string) {
    if (!selected) return;
    if (typeof selected.submittedBy === "string" && selected.submittedBy === sessionUserId) { setDetailError("Maker-checker protection: a reviewer cannot decide their own submission."); return; }
    if (active === "claims" && typeof selected.expiresAt === "string" && new Date(selected.expiresAt).getTime() <= Date.now()) { setDetailError("This claim evidence has expired and cannot be verified."); return; }
    if (!confirmedRevision) { setDetailError("Confirm that you reviewed the exact revision and evidence shown here."); return; }
    const id = itemId(active, selected);
    const brandId = display(selected.brandId);
    if (!id || (active !== "taxonomy" && !/^[0-9a-f-]{36}$/i.test(brandId))) { setDetailError("This review item is missing its persisted reference."); return; }
    const normalizedReason = reasonCode.trim().toUpperCase();
    if (active !== "taxonomy" && !/^[A-Z][A-Z0-9_]{1,63}$/.test(normalizedReason)) { setDetailError("Enter a reason code using uppercase letters, numbers, and underscores."); return; }
    setBusy(true); setDetailError(""); setNotice("");
    try {
      const session = await getCurrentSession();
      setMfaEnforcementMode(session.mfaEnforcementMode);
      let csrfToken = session.csrfToken;
      if (shouldRequestMfaStepUp(session.mfaEnforcementMode)) {
        if (!/^(?:\d{6}|[A-Z2-7]{26})$/.test(mfaCode.trim().toUpperCase())) {
          throw new Error("Enter a six-digit authenticator code or unused recovery code.");
        }
        const elevated = await stepUpWithMfa(mfaCode.trim().toUpperCase(), session.csrfToken);
        csrfToken = elevated.csrfToken;
        setSessionCsrfToken(elevated.csrfToken);
        setMfaCode("");
      }
      const idempotencyKey = crypto.randomUUID();
      let path: string[]; let body: Record<string, unknown>; let ifMatch: string | undefined;
      if (active === "taxonomy") {
        if (decision !== "PUBLISH_SCHEMA") throw new Error("Unsupported taxonomy action.");
        path = ["admin", "catalog", "categories", display(selected.categoryId), "schema-versions", display(selected.version), "publish"];
        body = {};
      } else if (active === "pricing") {
        path = ["admin", "brands", brandId, "variant-prices", id, "decision"];
        body = { decision, reasonCode: normalizedReason, expectedState: "PENDING", ...(comment.trim() ? { comment: comment.trim() } : {}) };
      } else if (active === "claims") {
        path = ["admin", "brands", brandId, "claims", id, "decision"];
        body = { decision, reasonCode: normalizedReason, ...(comment.trim() ? { comment: comment.trim() } : {}) };
        ifMatch = `"${display(selected.rowVersion)}"`;
      } else if (active === "quality") {
        path = ["admin", "brands", brandId, "products", display(selected.productId), "review"];
        body = { decision, reasonCode: normalizedReason, expectedRevisionId: display(selected.revisionId), expectedRowVersion: Number(selected.rowVersion), ...(comment.trim() ? { comment: comment.trim() } : {}) };
      } else {
        const operation = decision === "PUBLISH" ? "publish" : decision === "RESTRICT" ? "restrict" : "unpublish";
        path = ["admin", "brands", brandId, "products", display(selected.productId), "publication", operation];
        body = operation === "publish"
          ? { approvedRevisionId: selected.revisionId, approvedReviewId: selected.approvalId, expectedProductVersion: Number(selected.rowVersion) }
          : { reasonCode: normalizedReason, expectedProductVersion: Number(selected.rowVersion), ...(comment.trim() ? { comment: comment.trim() } : {}) };
      }
      await w2Request<Record<string, unknown>>(path, { method: "POST", body, csrfToken, idempotencyKey, ...(ifMatch ? { ifMatch } : {}) });
      setNotice("Decision recorded. The queue is refreshing from persisted data."); setSelected(null); setConfirmedRevision(false); setReasonCode(""); setComment("");
      await loadQueue(active);
    } catch (error) { setDetailError(errorMessage(error)); }
    finally { setBusy(false); }
  }

  const title = selected ? display(selected.title ?? selected.categoryLabel ?? selected.claimText ?? selected.styleCode) : "Select a review item";
  const selfSubmitted = Boolean(selected && typeof selected.submittedBy === "string" && selected.submittedBy === sessionUserId);
  const expiredClaim = Boolean(selected && active === "claims" && typeof selected.expiresAt === "string" && new Date(selected.expiresAt).getTime() <= Date.now());
  const decisionBlocked = selfSubmitted || expiredClaim;
  return (
    <div className={styles.shell}>
      <main className={styles.main} id="overview" aria-labelledby="operations-title" data-screen-id={initialItemId || selected ? "AD-08B" : "AD-08A"}>
        <header className={styles.topbar}><p><span>Workspace</span><span aria-hidden="true">/</span><strong>Operations</strong></p><div className={styles.topbarActions}>{initialItemId ? <a className={styles.navLink} href={reviewQueuePath(active)}>Back to queue</a> : null}{sessionReady ? <button className={styles.sessionButton} type="button" onClick={() => void signOut()} disabled={signOutBusy}>{signOutBusy ? "Signing out…" : "Sign out"}</button> : sessionError ? <a className={styles.sessionButton} href="/sign-in">Sign in</a> : null}<span className={styles.previewBadge}><span aria-hidden="true" /> Authenticated review</span></div></header>
        <div className={selected ? `${styles.content} ${styles.withDetail}` : styles.content}>
          <section className={styles.hero} aria-labelledby="operations-title"><div><h1 id="operations-title">{area.title}</h1><p className={styles.heroCopy}>{active === "taxonomy" ? "Review category details created by another admin. Approve to publish the new version." : "Check each submitted version, its current evidence and authorized review decisions. The backend is the source of truth."}</p></div></section>
          {sessionError ? <section className={styles.statusPanel} role="alert"><h2>Sign in required</h2><p>{sessionError}</p><a href="/sign-in">Go to sign in</a></section> : null}
          {sessionReady ? <section className={styles.reviewSection} aria-labelledby="queue-title">
            <nav className={styles.queueTabs} aria-label="Review queues">
              {queues.map((queue) => <Link key={queue.id} href={reviewQueuePath(queue.id)} className={active === queue.id ? styles.queueTabActive : styles.queueTab} aria-current={active === queue.id ? "page" : undefined}>{queue.title}</Link>)}
            </nav>
            <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>LIVE REVIEW QUEUE</p><h2 id="queue-title">{area.title}</h2><p>{area.description}</p></div><button className={styles.navLink} type="button" onClick={() => void loadQueue(active)} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button></div>
            {notice ? <p className={styles.availability} role="status">{notice}</p> : null}
            {queueError ? <div className={styles.availability} role="alert"><p>{queueError}</p><button type="button" onClick={() => void loadQueue(active)}>Retry</button></div> : null}
            {loading && !queueError ? <p role="status">Loading persisted review items…</p> : null}
            {!loading && !queueError && items.length === 0 ? <div className={styles.availability} role="status"><strong>Queue is empty</strong><p>No persisted review items are currently available to this admin permission.</p></div> : null}
            <div className={styles.reviewGrid}>
              {!queueError && items.map((item) => {
                const id = itemId(active, item);
                return <article key={id ?? JSON.stringify(item)} className={styles.reviewCard}>
                  <div className={styles.cardTop}><span className={styles.cardIndex}>{display(item.brandName ?? item.categoryCode ?? item.status)}</span><span className={styles.gatedBadge}>{display(item.status ?? item.publicationState ?? "Pending")}</span></div>
                  <h3>{display(item.title ?? item.categoryLabel ?? item.claimText ?? item.sku ?? item.styleCode ?? id)}</h3>
                  <p className={styles.cardCopy}>{active === "taxonomy" ? `Category update · Version ${display(item.version)} · ${display(item.ruleCount)} details` : `Brand: ${display(item.brandName)} · Submitted: ${display(item.submittedAt)}`}</p>
                  {active !== "taxonomy" ? <p className={styles.cardCopy}>Revision: {display(item.revisionId ?? item.version)} · Version: {display(item.rowVersion ?? item.contentVersion)}</p> : null}
                  <button className={styles.disabledAction} type="button" disabled={!id} onClick={() => void openItem(item)}>Review details</button>
                </article>;
              })}
            </div>
          </section> : null}
          {detailError ? <p className={styles.availability} role="alert">{detailError}</p> : null}
          {selected ? <section className={`${styles.statusPanel} ${styles.detailPanel}`} aria-labelledby="detail-title"><p className={styles.eyebrow}>{active === "taxonomy" ? "CATEGORY APPROVAL" : "EXACT PERSISTED ITEM"}</p><h2 id="detail-title">{title}</h2>
                    {active === "taxonomy" ? <div className={styles.statusFacts}><p>Version {display(selected.version)} · {Array.isArray(selected.rules) ? selected.rules.length : 0} product details</p>{Array.isArray(selected.rules) && selected.rules.map((rule, i) => { const entry=rule as Record<string,unknown>; return <p key={i}><strong>{display(entry.label ?? entry.code)}</strong> · {entry.requiredByDefault ? "Required" : "Optional"}</p>; })}</div> : <dl className={styles.statusFacts}>{Object.entries(selected).filter(([key]) => !["snapshot", "rules", "evidence", "media", "history", "ruleset"].includes(key)).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{display(value)}</dd></div>)}</dl>}
                    <p className={styles.availability} role="status"><strong>Maker-checker:</strong> submitted by {display(selected.submittedBy)}; current reviewer {display(sessionUserId)}. {selfSubmitted ? "Decision disabled because the submitter cannot review their own work." : expiredClaim ? "Decision disabled because claim evidence is expired." : "Independent reviewer required."}</p>
            {selected.snapshot ? <details><summary>Frozen revision snapshot</summary><pre>{JSON.stringify(selected.snapshot, null, 2)}</pre></details> : null}
            
            {selected.evidence ? <details><summary>Evidence and expiry metadata</summary><pre>{JSON.stringify(selected.evidence, null, 2)}</pre></details> : null}
            {selected.media ? <details><summary>Media safety status</summary><pre>{JSON.stringify(selected.media, null, 2)}</pre></details> : null}
            {selected.history ? <details><summary>Price review history</summary><pre>{JSON.stringify(selected.history, null, 2)}</pre></details> : null}
            <form onSubmit={(event) => { event.preventDefault(); void decide(active === "taxonomy" ? "PUBLISH_SCHEMA" : active === "publishing" ? (selected.publicationState === "PUBLISHED" ? "RESTRICT" : selected.publicationState === "RESTRICTED" ? "UNPUBLISH" : "PUBLISH") : active === "quality" ? "APPROVED" : active === "claims" ? "VERIFY" : "APPROVE"); }}>
              <label className={styles.confirmation}><input type="checkbox" checked={confirmedRevision} onChange={(event) => setConfirmedRevision(event.target.checked)} /> I reviewed the exact revision and evidence shown above.</label>
              {active !== "taxonomy" ? <><label htmlFor="review-reason">Reason code</label><input id="review-reason" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} required maxLength={64} autoComplete="off" /></> : null}
              {active !== "taxonomy" ? <><label htmlFor="review-comment">Reviewer comment <span>(optional)</span></label><textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} /></> : null}
              {sessionReady && shouldRequestMfaStepUp(mfaEnforcementMode) ? <><label htmlFor="review-mfa">Authenticator or recovery code</label><input id="review-mfa" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} required autoComplete="one-time-code" inputMode="text" /></> : null}
              <div className={styles.cardTop}>
                        {active === "quality" ? <><button type="submit" disabled={busy || decisionBlocked}>Approve exact revision</button><button type="button" disabled={busy || decisionBlocked} onClick={() => void decide("REJECTED")}>Reject</button><button type="button" disabled={busy || decisionBlocked} onClick={() => void decide("CORRECTION_REQUIRED")}>Request correction</button><button type="button" disabled={busy || decisionBlocked} onClick={() => void decide("RESTRICTED")}>Restrict revision</button></> : null}
                        {active === "pricing" ? <><button type="submit" disabled={busy || decisionBlocked}>Approve price</button><button type="button" disabled={busy || decisionBlocked} onClick={() => void decide("REJECT")}>Reject</button></> : null}
                        {active === "claims" ? <><button type="submit" disabled={busy || decisionBlocked}>Verify claim</button><button type="button" disabled={busy || decisionBlocked} onClick={() => void decide("REJECT")}>Reject</button></> : null}
                        {active === "taxonomy" ? <button type="submit" disabled={busy || decisionBlocked || selected.isLeaf === false || selected.retired === true}>Approve and publish</button> : null}
                        {active === "publishing" ? <>{selected.publicationState === "APPROVED" ? <button type="submit" disabled={busy || decisionBlocked}>Publish exact approved revision</button> : selected.publicationState === "PUBLISHED" ? <><button type="submit" disabled={busy || decisionBlocked}>Restrict listing</button><button type="button" disabled={busy || decisionBlocked} onClick={() => void decide("UNPUBLISH")}>Unpublish</button></> : <button type="submit" disabled={busy || decisionBlocked}>Unpublish restricted listing</button>}</> : null}
              </div>
            </form>
          </section> : null}
          <footer className={styles.footer}><span>RENIVET · OPERATIONS</span><span>Writes require global W1 permission, CSRF and the server’s current MFA policy.</span></footer>
        </div>
      </main>
    </div>
  );
}
