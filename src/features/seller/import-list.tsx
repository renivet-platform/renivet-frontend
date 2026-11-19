"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { W2ApiError,w2Request } from "./w2-catalog";
import type { operations } from "@/generated/renivet-api";
import style from "./import-inventory-prototype.module.css";

type Batch = { id:string;fileName:string|null;sourceKind:string;status:string;rowCount:number;createdAt:string;sourceAsOf:string };
type ImportListResponse = { items:Batch[];nextCursor:string|null };
type ImportResults = operations["getImportResults"]["responses"][200]["content"]["application/json"];

function formatDate(v:string) {const d=new Date(v);return Number.isNaN(d.getTime())?"Not recorded":d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}
function message(e:unknown) {if(e instanceof W2ApiError)return e.status===404?"The import history API needs the new backend release.":e.message;return "Could not load imports. Try again.";}

export function ImportList({brandId}:{brandId:string}) {
  const [items,setItems]=useState<Batch[]>([]);
  const [cursor,setCursor]=useState<string|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  const root="/brands/"+encodeURIComponent(brandId)+"/imports";
  async function load(next?:string|null) {
    setLoading(true);setError("");
    try{const page=await w2Request<ImportListResponse>(["brands",brandId,"product-imports"],{query:next?{limit:"25",cursor:next}:{limit:"25"}});
      setItems(current=>next?[...current,...page.items]:page.items);setCursor(page.nextCursor);
    }catch(e){setError(message(e));}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[brandId]);
  return <main className={style.importPage} data-screen-id="SE-12" aria-labelledby="import-list-title">
    <header className={style.simpleHeader}><div><h1 id="import-list-title">Imports</h1><p>Bring product information from your existing catalogue into Renivet.</p></div>
      <Link href={root+"/new"} className={style.newImportLink}>New import</Link></header>
    <section className={style.wizardCard} aria-labelledby="import-history-title">
      <h2 id="import-history-title">Your imports</h2>
      <p>Imports change catalogue drafts only. Stock is managed separately.</p>
      {error&&<p role="alert" className={style.importError}>{error} <button type="button" onClick={()=>void load()}>Retry</button></p>}
      {loading&&items.length===0&&<p role="status" className={style.listEmpty}>Loading your import history…</p>}
      {!loading&&!error&&items.length===0&&<div className={style.emptyHistory}><strong>No product imports yet</strong><p>Upload a CSV/XLSX export, match its columns, review conflicts and confirm before any drafts change.</p><Link href={root+"/new"}>Start your first import</Link></div>}
      {items.length>0&&<div className={style.historyScroll}><table className={style.historyTable}><thead><tr><th>Source</th><th>Date</th><th>Products</th><th>Status</th><th><span className={style.srOnly}>Action</span></th></tr></thead><tbody>
        {items.map(item=><tr key={item.id}><th scope="row"><strong>{item.fileName||item.sourceKind.replaceAll("_"," ")}</strong><small>{item.sourceKind.replaceAll("_"," ")}</small></th><td>{formatDate(item.createdAt)}</td><td>{item.rowCount}</td><td><span className={style.importStatus}>{item.status.replaceAll("_"," ").toLowerCase()}</span></td><td><Link className={style.openImport} href={root+"/"+encodeURIComponent(item.id)}>View</Link></td></tr>)}
      </tbody></table></div>}
      {cursor&&<button type="button" disabled={loading} onClick={()=>void load(cursor)} className={style.loadMore}>{loading?"Loading…":"Load more"}</button>}
    </section>
  </main>;
}

export function ImportBatchResults({brandId,batchId}:{brandId:string;batchId:string}) {
  const [data,setData]=useState<ImportResults|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  const root="/brands/"+encodeURIComponent(brandId)+"/imports";
  async function load(){setLoading(true);setError("");
    try {setData(await w2Request<ImportResults>(["brands",brandId,"product-imports",batchId,"results"],{query:{limit:"100"}}));}
    catch(e){setError(message(e));}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[brandId,batchId]);
  return <main className={style.importPage} data-screen-id="SE-12C" aria-labelledby="import-results-title">
    <nav className={style.importBreadcrumb}><Link href={root}>Imports</Link><span aria-hidden="true">/</span><span>Results</span></nav>
    <header className={style.simpleHeader}><div><h1 id="import-results-title">Import results</h1><p>Every row shown is a persisted backend import result.</p></div></header>
    <section className={style.wizardCard}>
      {loading&&<p role="status">Loading results…</p>}
      {error&&<p role="alert">{error} <button type="button" onClick={()=>void load()}>Retry</button></p>}
      {data&&<><div className={style.historyScroll}><table className={style.historyTable}><thead><tr><th>Row</th><th>Status</th><th>Errors</th></tr></thead><tbody>{data.items.map(row=><tr key={row.rowNumber}><th scope="row">{row.rowNumber}</th><td>{row.status.replaceAll("_"," ")}</td><td>{row.errorCodes.join(", ")||"None"}</td></tr>)}</tbody></table></div>
        {data.items.length===0&&<p>No result rows were returned for this import.</p>}</>}
      <div className={style.wizardFooter}><Link href={root} className={style.openImport}>Back to imports</Link></div>
    </section>
  </main>;
}
