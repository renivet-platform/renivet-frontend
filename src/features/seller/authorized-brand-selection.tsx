"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthApiError, getCurrentSession, type SessionDestination } from "@/features/identity/auth-api";
import styles from "./authorized-brand-selection.module.css";

type State = { kind: "loading" } | { kind: "ready"; destination: SessionDestination } | { kind: "error"; message: string; signedOut: boolean };

export function AuthorizedBrandSelection() {
  const [state, setState] = useState<State>({ kind: "loading" });
  useEffect(() => {
    let live = true;
    void getCurrentSession().then((session) => {
      if (live) setState({ kind: "ready", destination: session.destination });
    }).catch((error: unknown) => {
      if (!live) return;
      setState({ kind: "error", signedOut: error instanceof AuthApiError && error.status === 401, message: error instanceof AuthApiError && error.status === 401 ? "Sign in to see the brands available to your account." : "Authorized brand access could not be checked. Try again shortly." });
    });
    return () => { live = false; };
  }, []);

  return <main className={styles.page} aria-labelledby="brand-selection-title">
    <p className={styles.kicker}>Brand workspace</p>
    <h1 id="brand-selection-title">Your brands</h1>
    <p className={styles.intro}>Only brands returned by your signed-in Renivet session are shown here.</p>
    {state.kind === "loading" && <p className={styles.notice} role="status">Checking your authorized brand access…</p>}
    {state.kind === "error" && <section className={styles.notice} role="alert"><p>{state.message}</p>{state.signedOut ? <Link className={styles.button} href="/sign-in?next=%2Fbrands">Sign in</Link> : <button className={styles.button} type="button" onClick={() => { setState({ kind: "loading" }); void getCurrentSession().then((session) => setState({ kind: "ready", destination: session.destination })).catch(() => setState({ kind: "error", signedOut: false, message: "Authorized brand access could not be checked. Try again shortly." })); }}>Try again</button>}</section>}
    {state.kind === "ready" && state.destination.kind === "brands" && <div className={styles.grid}>{state.destination.brands.map((brand) => <article className={styles.card} key={brand.id}><span className={styles.mark} aria-hidden="true">{brand.name.slice(0,1).toUpperCase()}</span><div><h2>{brand.name}</h2><p>Access confirmed for this session</p></div><Link className={styles.button} href={`/brands/${encodeURIComponent(brand.id)}/workspace`}>Open workspace</Link></article>)}</div>}
    {state.kind === "ready" && state.destination.kind === "operations" && <section className={styles.notice}><p>Your current session is assigned to Renivet operations.</p><Link className={styles.button} href="/operations">Open operations</Link></section>}
    {state.kind === "ready" && state.destination.kind === "storefront" && <section className={styles.notice}><p>No brand workspace is assigned to this account.</p><Link href="/">Return to Renivet</Link></section>}
  </main>;
}
