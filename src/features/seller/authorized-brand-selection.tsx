"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthApiError, getCurrentSession, type SessionDestination } from "@/features/identity/auth-api";
import styles from "./authorized-brand-selection.module.css";
import visual from "./seller-onboarding-prototype.module.css";

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

  return <main className={styles.page} aria-labelledby="brand-selection-title" data-screen-id="SE-20A">
    <p className={styles.kicker}>Brand workspace</p>
    <h1 id="brand-selection-title">Your brands</h1>
    <p className={styles.intro}>Your approved brand workspaces appear here. Applications awaiting review are listed separately.</p>
    <section className={visual.pendingInvitations} aria-labelledby="pending-invitations-title">
      <div><h2 id="pending-invitations-title">Invitations</h2><p>Invitations from other brands will appear when the membership invitation and acceptance API is approved. No pending invitations are inferred from your existing role.</p></div>
      <span className={visual.pendingBadge}>Not connected</span>
    </section>
        {state.kind === "loading" && <p className={styles.notice} role="status">Checking your authorized brand access…</p>}
    {state.kind === "error" && <section className={styles.notice} role="alert"><p>{state.message}</p>{state.signedOut ? <Link className={styles.button} href="/sign-in?next=%2Fbrands">Sign in</Link> : <button className={styles.button} type="button" onClick={() => { setState({ kind: "loading" }); void getCurrentSession().then((session) => setState({ kind: "ready", destination: session.destination })).catch(() => setState({ kind: "error", signedOut: false, message: "Authorized brand access could not be checked. Try again shortly." })); }}>Try again</button>}</section>}
    {state.kind === "ready" && state.destination.kind === "brands" && <div className={styles.grid}>{state.destination.brands.map((brand) => <article className={styles.card} key={brand.id}><span className={styles.mark} aria-hidden="true">{brand.name.slice(0,1).toUpperCase()}</span><div><h2>{brand.name}</h2><p>Access confirmed for this session</p></div><Link className={styles.button} href={`/brands/${encodeURIComponent(brand.id)}/workspace`}>Open workspace</Link></article>)}</div>}
    <p className={visual.selectionFooter}><Link href="/brands/join">Apply to sell on Renivet</Link> · <Link href="/brands/join/application">See pending applications</Link></p>
        {state.kind === "ready" && state.destination.kind === "operations" && <section className={styles.notice}><p>Your current session is assigned to Renivet operations.</p><Link className={styles.button} href="/operations">Open operations</Link></section>}
    {state.kind === "ready" && state.destination.kind === "storefront" && <section className={styles.notice}><p>No brand workspace is assigned to this account.</p><Link href="/">Return to Renivet</Link></section>}
  </main>;
}
