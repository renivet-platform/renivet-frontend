"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./admin-audit-prototype.module.css";

type AuditRow = {
  id: string; actorUserId: string | null; action: string;
  subjectType: string; subjectId: string | null; occurredAt: string;
};
type AuditPage = { items: AuditRow[]; nextCursor: string | null };
const pageSize = "30";
function errorText(error: unknown) {
  if (error instanceof W2ApiError) {
    if (error.status === 401) return "Your session expired. Sign in as Renivet staff to continue.";
    if (error.status === 403) return "Your staff role does not have permission to read global audit records.";
    return error.message;
  }
  return "Audit records could not be loaded. Try again.";
}
function readable(value: string): string {
  return value.replaceAll(/[._:-]+/g," ").replace(/\b[a-z]/g,match=>match.toUpperCase());
}
export function AdminAuditScreen() {
  const [rows,setRows] = useState<AuditRow[]>([]);
  const [nextCursor,setNextCursor] = useState<string | null>(null);
  const [loading,setLoading] = useState(true);
  const [moreLoading,setMoreLoading] = useState(false);
  const [error,setError] = useState("");
  const [query,setQuery] = useState("");
  const requestGeneration = useRef(0);

  const load = useCallback(async (cursor?: string) => {
    const generation = ++requestGeneration.current;
    if (cursor) setMoreLoading(true); else { setLoading(true); setRows([]); }
    setError("");
    try {
      const page = await w2Request<AuditPage>(["admin","access-audit"],{query:{limit:pageSize,...(cursor?{cursor}:{})}});
      if (generation !== requestGeneration.current) return;
      setRows(current => cursor ? [...current,...page.items] : page.items);
      setNextCursor(page.nextCursor);
    } catch(caught) {
      if (generation === requestGeneration.current) setError(errorText(caught));
    } finally {
      if (generation === requestGeneration.current) { setLoading(false); setMoreLoading(false); }
    }
  },[]);
  useEffect(()=>{void load();return ()=>{requestGeneration.current+=1;};},[load]);

  // Search is explicitly limited to server-loaded records. No query string is
  // sent to the privileged audit API until an approved filter contract exists.
  const visibleRows=rows.filter(row=>{
    const term=query.toLocaleLowerCase().trim();
    return !term || [row.action,row.subjectType,row.actorUserId ?? "",row.subjectId ?? ""]
      .some(value=>value.toLocaleLowerCase().includes(term));
  });

  return <main className={styles.page} data-screen-id="AD-20" aria-labelledby="audit-heading">
    <header className={styles.heading}>
      <div><h1 id="audit-heading">Audit log</h1><p>Every sensitive operation leaves an immutable, permission-controlled record.</p></div>
      <button type="button" className={styles.refresh} onClick={()=>void load()} disabled={loading}>Refresh</button>
    </header>
    <section className={styles.filterCard} aria-label="Audit filtering">
      <label htmlFor="audit-search">Search loaded activity
        <input id="audit-search" type="search" placeholder="Search action or subject" value={query} onChange={event=>setQuery(event.currentTarget.value)}/>
      </label>
      <p>Search covers {rows.length} loaded records. No complete-history search or export is implied.</p>
    </section>
    {error && <section role="alert" className={styles.error}><strong>Audit unavailable</strong><p>{error}</p><button type="button" onClick={()=>void load()}>Try again</button></section>}
    <section className={styles.tableCard} aria-label="Persisted audit records">
      <div className={styles.tableHeading}><h2>Recent activity</h2><span>{loading?"Loading…":`${visibleRows.length} shown`}</span></div>
      {loading ? <p className={styles.empty} role="status">Loading authorized audit events…</p>
        : !error && visibleRows.length === 0 ? <p className={styles.empty}>{rows.length?"No loaded events match your search.":"No audit events were returned by this authorized query."}</p>
        : !error && <div className={styles.tableWrap}><table>
          <thead><tr><th scope="col">When</th><th scope="col">Action</th><th scope="col">Actor</th><th scope="col">Subject</th></tr></thead>
          <tbody>{visibleRows.map(event=><tr key={event.id}>
            <td data-label="When">{new Date(event.occurredAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</td>
            <th scope="row" data-label="Action">{readable(event.action)}</th>
            <td data-label="Actor">{event.actorUserId ? `Staff ID ${event.actorUserId.slice(0,8)}…` : "Automated/system"}</td>
            <td data-label="Subject">{readable(event.subjectType)}{event.subjectId?` · ${event.subjectId.slice(0,8)}…`:""}</td>
          </tr>)}</tbody></table></div>}
      {nextCursor && !error && <div className={styles.footer}><button type="button" disabled={moreLoading} onClick={()=>void load(nextCursor)}>{moreLoading?"Loading…":"Load more events"}</button></div>}
    </section>
    <p className={styles.note}>Audit history is read-only. Personal IP/device information and payload hashes are never included in this response. Only globally authorized Renivet administrators can load these events.</p>
  </main>;
}
