"use client";

import { useEffect, useState } from "react";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./admin-audit.module.css";

interface AuditRow {
 id:string;action:string;actor:string;subjectType:string;subjectId:string|null;requestId:string;occurredAt:string;
}
interface AuditPage { items:AuditRow[];nextCursor:string|null; }
const errText=(e:unknown)=>e instanceof W2ApiError ? (e.status===403?"Only authorized Renivet administrators can read security audit events.":e.status===401?"Sign in to your Renivet staff account.":e.status===404?"The audited event API is not yet deployed in this environment.":e.message) : "The audit service could not be reached.";
const dateLabel=(value:string)=>{const d=new Date(value);return Number.isNaN(d.getTime())?"Not recorded":d.toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});};

export function AdminAuditScreen() {
 const [items,setItems]=useState<AuditRow[]>([]),[nextCursor,setNextCursor]=useState<string|null>(null),[action,setAction]=useState(""),[submittedAction,setSubmittedAction]=useState("");
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(cursor?:string|null,filter=submittedAction){
  setLoading(true);setError("");
  try{
   const query:Record<string,string>={limit:"25"};
   if(cursor)query.cursor=cursor;
   if(filter.trim())query.action=filter.trim();
   const page=await w2Request<AuditPage>(["admin","security-audit"],{query});
   setItems(prev=>cursor?[...prev,...page.items]:page.items);setNextCursor(page.nextCursor);
  }catch(e){setError(errText(e));}finally{setLoading(false);}
 }
 useEffect(()=>{void load(null,"");},[]);
 function filter(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setSubmittedAction(action.trim());void load(null,action.trim());}
 return <main className={styles.page} data-screen-id="AD-20" aria-labelledby="audit-title">
  <header className={styles.header}><div><h1 id="audit-title">Audit log</h1><p>Read-only record of platform access changes and security decisions.</p></div>
   <button type="button" className={styles.secondary} onClick={()=>void load(null)} disabled={loading}>Refresh</button></header>
  <section className={styles.filterCard} aria-labelledby="audit-filters">
   <h2 id="audit-filters">Find an event</h2>
   <form onSubmit={filter}><label htmlFor="audit-action">Action code</label><input id="audit-action" value={action} onChange={e=>setAction(e.currentTarget.value)} placeholder="e.g. brand_team.member_revoked" maxLength={128} pattern="[a-z][a-z0-9_.:-]*"/>
    <button type="submit" disabled={loading}>Apply filter</button><button type="button" className={styles.secondary} disabled={loading} onClick={()=>{setAction("");setSubmittedAction("");void load(null,"");}}>Clear</button>
   </form>
   <p>Events are immutable. Search uses actual backend audit action codes; no raw tokens, IP hashes or event payloads are displayed.</p>
  </section>
  <section className={styles.panel} aria-labelledby="audit-events">
   <div className={styles.panelHeading}><h2 id="audit-events">Recorded activity</h2><span>Most recent first</span></div>
   {error&&<div role="alert" className={styles.error}>{error}<button type="button" onClick={()=>void load(null)} disabled={loading}>Try again</button></div>}
   {loading&&!items.length&&<p role="status" className={styles.empty}>Loading audit activity…</p>}
   {!loading&&!error&&!items.length&&<p className={styles.empty}>No events match this authorized query.</p>}
   {items.length>0&&<div className={styles.tableScroll}><table><thead><tr><th>When</th><th>Action</th><th>Actor</th><th>Subject</th><th>Reference</th></tr></thead><tbody>
    {items.map(row=><tr key={row.id}><td data-label="When">{dateLabel(row.occurredAt)}</td><th scope="row" data-label="Action">{row.action.replaceAll("_"," ")}</th><td data-label="Actor">{row.actor}</td><td data-label="Subject">{row.subjectType.replaceAll("_"," ")}</td><td data-label="Reference">{row.requestId}</td></tr>)}
   </tbody></table></div>}
   {nextCursor&&<div className={styles.footer}><button className={styles.secondary} type="button" onClick={()=>void load(nextCursor)} disabled={loading}>{loading?"Loading…":"Load older events"}</button></div>}
  </section>
 </main>;
}
