"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthApiError, getCurrentSession } from "@/features/identity/auth-api";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./operations-home.module.css";

type QueueId = "quality" | "claims" | "pricing" | "publishing" | "taxonomy" | "applications";
type QueueCard = { id: QueueId; title: string; description: string; href: string; state: "loading" | "ready" | "error"; returned?: number; error?: string };
const baseCards: Array<Omit<QueueCard, "state" | "returned" | "error">> = [
  { id: "applications", title: "Brand applications", description: "Persisted application reviews.", href: "/operations/applications" },
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

  return <main className={styles.page} aria-labelledby="operations-home-title">
    <header className={styles.header}><div><p className={styles.kicker}>RENIVET OPERATIONS</p><h1 id="operations-home-title">Operations home</h1><p>Your review queues are loaded from Renivet services. Counts reflect records returned by each live queue request.</p></div><button className={styles.refresh} type="button" onClick={() => void load()}>Refresh queues</button></header>
    {sessionError && <p className={styles.error} role="alert">{sessionError}</p>}
    <section className={styles.grid} aria-label="Review queues" aria-live="polite">
      {cards.map((card) => <article className={styles.card} key={card.id}>
        <div className={styles.cardTop}><h2>{card.title}</h2>{card.state === "ready" && <strong className={styles.count}>{card.returned}</strong>}{card.state === "loading" && <span className={styles.loading} aria-label="Loading">…</span>}</div>
        <p>{card.description}</p>
        {card.state === "ready" ? <p className={styles.state}>{card.returned === 0 ? "No records were returned." : `${card.returned} records returned by the API.`}</p> : card.state === "error" ? <p className={styles.error} role="status">{card.error}</p> : <p className={styles.state} role="status">Checking queue…</p>}
        <Link href={card.href}>Open queue <span aria-hidden="true">→</span></Link>
      </article>)}
    </section>
    <section className={styles.notice}><h2>Some operations are still gated</h2><p>Bank verification, stock exceptions, staff access, privacy requests, and audit history are not connected until their access contracts are approved. No counts or recent activity are invented for those areas.</p><Link href="/operations/bank">Review unavailable workflows</Link></section>
  </main>;
}
