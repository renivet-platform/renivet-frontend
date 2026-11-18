"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthApiError, getCurrentSession } from "@/features/identity/auth-api";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./operations-home.module.css";

type QueueId = "quality" | "claims" | "pricing" | "publishing" | "taxonomy" | "applications";
type QueueCard = { id: QueueId; title: string; description: string; href: string; state: "loading" | "ready" | "error"; returned?: number; error?: string };
const baseCards: Array<Omit<QueueCard, "state" | "returned" | "error">> = [
  { id: "applications", title: "Brand applications", description: "Persisted application reviews.", href: "/brand-approvals" },
  { id: "quality", title: "Product quality", description: "Submitted revisions awaiting review.", href: "/operations/quality" },
  { id: "claims", title: "Claims & evidence", description: "Claims requiring independent evidence review.", href: "/operations/claims" },
  { id: "pricing", title: "Pricing", description: "Price proposals awaiting approval.", href: "/operations/pricing" },
  { id: "publishing", title: "Publishing", description: "Approved revisions ready for publish or restriction.", href: "/operations/publishing" },
  { id: "taxonomy", title: "Taxonomy", description: "Schema versions awaiting independent review.", href: "/operations/taxonomy" },
];

function safeError(error: unknown) {
  const status = error instanceof W2ApiError || error instanceof AuthApiError ? error.status : 0;
  if (status === 401) return "Your session expired. Sign in again to continue.";
  if (status === 403) return "Your account cannot view this review queue.";
  if (status === 503 || status === 0) return "This queue is temporarily unavailable.";
  return "The queue could not be loaded.";
}

export function OperationsHome() {
  const [cards, setCards] = useState<QueueCard[]>(baseCards.map((card) => ({ ...card, state: "loading" })));
  const [sessionError, setSessionError] = useState("");
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setSessionError("");
    setCards(baseCards.map((card) => ({ ...card, state: "loading" })));
    try {
      await getCurrentSession();
    } catch (error) {
      if (currentRequest === requestId.current) {
        setSessionError(safeError(error));
        setCards(baseCards.map((card) => ({ ...card, state: "error", error: safeError(error) })));
      }
      return;
    }
    const results = await Promise.allSettled(baseCards.map((card) => card.id === "applications"
      ? w2Request<{ items: unknown[] }>(["admin", "brand-application-reviews"])
      : w2Request<{ items?: unknown[] }>(["admin", "reviews", card.id], { query: { limit: "100" } })));
    if (currentRequest !== requestId.current) return;
    setCards(baseCards.map((card, index) => {
      const result = results[index]!;
      return result.status === "fulfilled"
        ? { ...card, state: "ready", returned: Array.isArray(result.value.items) ? result.value.items.length : 0 }
        : { ...card, state: "error", error: safeError(result.reason) };
    }));
  }, []);

  useEffect(() => { void load(); return () => { requestId.current += 1; }; }, [load]);

  // Ordered to match the approved AD-02 4x2 visual layout. Unsupported feeds
  // remain explicitly unavailable instead of inheriting fictional prototype data.
  const orderedCards = [
    cards.find(card => card.id === "applications")!,
    { id:"bank", title:"Bank verification", description:"Sensitive bank review has no approved API yet.", href:"/operations/bank", state:"unavailable" as const },
    cards.find(card => card.id === "quality")!,
    cards.find(card => card.id === "claims")!,
    cards.find(card => card.id === "pricing")!,
    cards.find(card => card.id === "publishing")!,
    { id:"exceptions", title:"Inventory exceptions", description:"Stock exception read and review API is pending approval.", href:"/operations/exceptions", state:"unavailable" as const },
    cards.find(card => card.id === "taxonomy")!,
  ];

  return <main className={styles.page} aria-labelledby="operations-home-title" data-screen-id="AD-02">
    <header className={styles.header}>
      <div><h1 id="operations-home-title">Operations home</h1><p>Review queues and the work requiring attention. Counts come from Renivet services, not demonstration data.</p></div>
      <button className={styles.refresh} type="button" onClick={() => void load()}>Refresh queues</button>
    </header>
    {sessionError && <p className={styles.error} role="alert">{sessionError}</p>}
    <section className={styles.grid} aria-label="Operations queues" aria-live="polite">
      {orderedCards.map(card => {
        const count = card.state === "ready" && "returned" in card ? card.returned : null;
        return <article className={styles.card} key={card.id}>
          <strong className={styles.metric}>{count ?? "—"}</strong>
          <h2>{card.title}</h2>
          {card.state === "unavailable"
            ? <p className={styles.unavailable}>Not connected · Contract pending</p>
            : card.state === "loading"
              ? <p className={styles.state} role="status">Checking backend queue…</p>
              : card.state === "error"
                ? <p className={styles.error} role="status">{"error" in card ? card.error : "The queue is unavailable."}</p>
                : <p className={styles.state}>{count === 0 ? "No records returned by this API." : "Records returned by this API page."}</p>}
          <Link href={card.href}>Open {card.title.toLowerCase()} <span aria-hidden="true">→</span></Link>
        </article>;
      })}
    </section>
    <section className={styles.activity} aria-labelledby="activity-title">
      <h2 id="activity-title">Recent activity</h2>
      <p>Event history is not loaded because the audited staff activity API has not yet been approved. We will not display sample reviewer names, timestamps or audit events from the prototype.</p>
      <Link href="/operations/audit">Open audit log information</Link>
    </section>
    <section className={styles.notice}>
      <h2>Some operations are still gated</h2>
      <p>Bank verification, stock exceptions, staff access, privacy requests and audit history need independent authorization and a registered backend contract before they can show data or accept decisions.</p>
      <Link href="/operations/bank">Review unavailable workflows</Link>
    </section>
  </main>;
}
