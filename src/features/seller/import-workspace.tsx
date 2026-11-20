"use client";

import { useEffect, useState } from "react";
import { AuthApiError, getCurrentSession } from "@/features/identity/auth-api";
import Link from "next/link";
import type { operations } from "@/generated/renivet-api";
import { categoryLabel, createIdempotencyKey, selectableCategories, type Category, type Paged, W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import { isStaleImportPreview, validateImportFieldMappings } from "@/features/seller/import-workspace-state";
import { buildImportTemplateCsv, type SourceProfile } from "@/features/seller/import-templates";
import { uniqueImportConflicts } from "@/features/seller/import-conflict-messages";
import styles from "./product-workspace.module.css";
import visual from "./import-inventory-prototype.module.css";

type UploadRequest = operations["beginCatalogImportUpload"]["requestBody"]["content"]["application/json"];
type UploadIntent = operations["beginCatalogImportUpload"]["responses"][201]["content"]["application/json"];
type CreateRequest = operations["createCatalogImport"]["requestBody"]["content"]["application/json"];
type MappingReceipt = operations["saveImportMapping"]["responses"][200]["content"]["application/json"];
type ImportPreview = operations["getCatalogImportPreview"]["responses"][200]["content"]["application/json"];
type Confirmation = operations["confirmCatalogImport"]["responses"][202]["content"]["application/json"];
type ImportResults = operations["getImportResults"]["responses"][200]["content"]["application/json"];
type MappingRow = { id: number; source: string; target: string };
type CategoryMappingRow = { id: number; source: string; target: string };

const maxImportBytes = 100 * 1024 * 1024;
const xlsxMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const targetFields = ["title", "styleCode", "sku", "categoryCode", "sourceProductKey", "sourceVariantKey", "sourceMrp", "imageUrl", "options.color", "options.size"];

const profileMappings: Record<SourceProfile, Array<[string, string]>> = {
  SHOPIFY: [["URL handle", "sourceProductKey"], ["Title", "title"], ["SKU", "sku"], ["Product category", "categoryCode"], ["Option1 value", "options.size"], ["Option2 value", "options.color"], ["Price", "sourceMrp"], ["Product image URL", "imageUrl"]],
  UNICOMMERCE: [["skuCode", "sku"], ["name", "title"], ["categoryCode", "categoryCode"], ["color", "options.color"], ["size", "options.size"], ["maxRetailPrice", "sourceMrp"], ["imageUrl", "imageUrl"]],
  RENIVET: [["styleCode", "styleCode"], ["title", "title"], ["sku", "sku"], ["categoryCode", "categoryCode"], ["color", "options.color"], ["size", "options.size"], ["mrp", "sourceMrp"]],
  GENERIC: [["title", "title"], ["styleCode", "styleCode"], ["sku", "sku"], ["categoryCode", "categoryCode"]],
};

function downloadTemplate(profile: SourceProfile) {
  const csv = buildImportTemplateCsv(profile);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `renivet-${profile.toLowerCase()}-product-template.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function errorText(error: unknown): string {
  if (error instanceof W2ApiError || error instanceof AuthApiError) return error.message;
  return "The import could not be completed. No unconfirmed changes were applied.";
}

async function digest(file: File): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, "0")).join("");
}

export function ImportWorkspace({ brandId }: { brandId: string }) {
  const [profile, setProfile] = useState<SourceProfile>("UNICOMMERCE");
  const [file, setFile] = useState<File | null>(null);
  const [sourceAsOf, setSourceAsOf] = useState("");
  const [mode, setMode] = useState<CreateRequest["mode"]>("REVIEW_CONFLICT");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [batchId, setBatchId] = useState("");
  const [mappingVersion, setMappingVersion] = useState(0);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [mappingRows, setMappingRows] = useState<MappingRow[]>(profileMappings.UNICOMMERCE.map(([source, target], id) => ({ id, source, target })));
  const [categoryRows, setCategoryRows] = useState<CategoryMappingRow[]>([]);
  const [nextRowId, setNextRowId] = useState(10);
  const [allowPartial, setAllowPartial] = useState(true);
  const [wizardStep, setWizardStep] = useState<"source" | "file">("source");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    w2Request<Paged<Category>>(["brands", brandId, "categories"], { query: { limit: "100" }, signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setCategories(result.items); })
      .catch((caught: unknown) => { if (!controller.signal.aborted) setCategoryError(errorText(caught)); });
    return () => controller.abort();
  }, [brandId]);


  const sourceKind: UploadRequest["sourceKind"] = file?.name.toLowerCase().endsWith(".xlsx")
    ? "RENIVET_XLSX"
    : profile === "SHOPIFY" ? "SHOPIFY_CSV" : profile === "UNICOMMERCE" ? "UNIWARE_CSV" : profile === "RENIVET" ? "RENIVET_CSV" : "GENERIC_CSV";
  const selectable = selectableCategories(categories);

  async function elevate(): Promise<string> {
    const session = await getCurrentSession();
    return session.csrfToken;
  }

  async function startImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (!file || !sourceAsOf) { setError("Choose a file and enter when the source export was created."); return; }
    if (file.size < 1 || file.size > maxImportBytes) { setError("The source file must be smaller than 100 MiB."); return; }
    const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
    if (!isXlsx && !file.name.toLowerCase().endsWith(".csv")) { setError("Choose a CSV or XLSX file."); return; }
    setBusy(true);
    try {
      const sha = await digest(file);
      const csrfToken = await elevate();
      const request: UploadRequest = { sourceKind, fileName: file.name, mimeType: isXlsx ? xlsxMime : "text/csv", byteLength: file.size, sha256: sha };
      const intent = await w2Request<UploadIntent>(["brands", brandId, "product-imports", "uploads"], { method: "POST", body: request, csrfToken, idempotencyKey: createIdempotencyKey() });
      const uploadUrl = new URL(intent.uploadUrl);
      const localUpload = uploadUrl.protocol === "http:" && ["127.0.0.1", "localhost"].includes(uploadUrl.hostname);
      if ((!localUpload && uploadUrl.protocol !== "https:") || intent.uploadMethod !== "PUT") throw new Error("The private upload intent is invalid.");
      const uploaded = await fetch(uploadUrl, { method: "PUT", headers: intent.headers, body: file, credentials: "omit", redirect: "error" });
      if (!uploaded.ok) throw new Error("The private file upload did not complete. Start again with a new upload intent.");
      const createBody: CreateRequest = { sourceKind: sourceKind as CreateRequest["sourceKind"], sourceAsOf: new Date(sourceAsOf).toISOString(), fileUploadId: intent.fileUploadId, mode };
      const accepted = await w2Request<operations["createCatalogImport"]["responses"][202]["content"]["application/json"]>(["brands", brandId, "product-imports"], { method: "POST", body: createBody, csrfToken, idempotencyKey: createIdempotencyKey() });
      setBatchId(accepted.batchId); setNotice("Private upload received and parsed. Map fields before reviewing the immutable preview.");
    } catch (caught) { setError(errorText(caught)); }
    finally { setBusy(false); }
  }

  async function saveMapping(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!batchId) return; setError(""); setNotice(""); setPreview(null); setResults(null); setConfirmation(null); setBusy(true);
    try {
      const fieldMappings = Object.fromEntries(mappingRows.filter((row) => row.source.trim() && row.target).map((row) => [row.source.trim(), row.target]));
      const categoryMappings = Object.fromEntries(categoryRows.filter((row) => row.source.trim() && row.target).map((row) => [row.source.trim(), row.target]));
      const mappingError = validateImportFieldMappings(mappingRows);
      if (mappingError) throw new Error(mappingError);
      const csrfToken = await elevate();
      const saved = await w2Request<MappingReceipt>(["brands", brandId, "product-imports", batchId, "mapping"], {
        method: "POST", body: { fieldMappings, categoryMappings }, csrfToken, idempotencyKey: createIdempotencyKey(), ifMatch: `"${mappingVersion}"`,
      });
      setMappingVersion(saved.mappingVersion);
      const frozen = await w2Request<ImportPreview>(["brands", brandId, "product-imports", batchId, "preview"]);
      setPreview(frozen); setNotice("Preview frozen. Review counts, conflicts and row actions before confirming.");
    } catch (caught) { setError(errorText(caught)); }
    finally { setBusy(false); }
  }

  async function confirmImport() {
    if (!preview || !batchId) return; setError(""); setNotice(""); setBusy(true);
    try {
      const csrfToken = await elevate();
      const result = await w2Request<Confirmation>(["brands", brandId, "product-imports", batchId, "confirm"], {
        method: "POST", body: { previewHash: preview.previewHash, previewRevision: preview.previewRevision, allowPartial }, csrfToken,
        idempotencyKey: createIdempotencyKey(), ifMatch: `"${preview.previewRevision}"`,
      });
      setConfirmation(result);
      const status = await w2Request<ImportResults>(["brands", brandId, "product-imports", batchId, "results"], { query: { limit: "100" } });
      setResults(status); setNotice(result.state === "PARTIAL" ? "All source rows remain saved. Some draft writes failed and can be retried." : "All source rows saved. Eligible rows were also written as private drafts; others stay staged for later editing.");
    } catch (caught) {
      if (isStaleImportPreview(caught)) { setPreview(null); setError("The target changed after this preview. Nothing was confirmed. Rebuild the preview to review the new target values."); }
      else setError(errorText(caught));
    } finally { setBusy(false); }
  }

  async function refreshResults() {
    if (!batchId) return; setBusy(true); setError("");
    try { setResults(await w2Request<ImportResults>(["brands", brandId, "product-imports", batchId, "results"], { query: { limit: "100" } })); }
    catch (caught) { setError(errorText(caught)); }
    finally { setBusy(false); }
  }

  async function retryFailed() {
    if (!batchId || !preview || !results) return; setBusy(true); setError(""); setNotice("");
    try {
      const csrfToken = await elevate();
      await w2Request(["brands", brandId, "product-imports", batchId, "retry"], { method: "POST", body: { mode: "FAILED_ONLY" }, csrfToken, idempotencyKey: createIdempotencyKey(), ifMatch: `"${preview.previewRevision}"` });
      setNotice("Retry was queued for failed rows only. Successful rows remain recorded.");
      await refreshResults();
    } catch (caught) { setError(errorText(caught)); }
    finally { setBusy(false); }
  }

  const importStep = results ? 5 : preview ? 4 : batchId ? 3 : wizardStep === "file" ? 2 : 1;
  function chooseProfile(next: SourceProfile) {
    if (batchId || busy) return;
    setProfile(next);
    setMappingRows(profileMappings[next].map(([source, target], id) => ({id,source,target})));
  }

  function addField() { setMappingRows((rows) => [...rows, { id: nextRowId, source: "", target: "" }]); setNextRowId((id) => id + 1); }
  function addCategory() { setCategoryRows((rows) => [...rows, { id: nextRowId, source: "", target: "" }]); setNextRowId((id) => id + 1); }


  const wizardLabels = ["Choose source", "Upload file", "Match columns", "Preview", "Results"];
  return <main className={styles.page} data-screen-id={results ? "SE-12C" : "SE-12A"} aria-labelledby="imports-title">
    <nav className={styles.detailBreadcrumb} aria-label="Breadcrumb">
      <Link href={"/brands/"+encodeURIComponent(brandId)+"/imports"}>Imports</Link><span aria-hidden="true">/</span><span>New import</span>
    </nav>
    <header className={visual.simpleHeader}>
      <div><h1 id="imports-title">{results ? "Import results" : "New import"}</h1>
      <p>Bring in products from your existing catalogue. Review every change before confirming.</p></div>
      <span className={visual.draftOnly}>Drafts only · No stock changes</span>
    </header>
    <nav className={visual.importProgress} aria-label="Import progress"><ol>
      {wizardLabels.map((label,i) => <li key={label} aria-current={i+1 === importStep ? "step" : undefined} className={i+1 === importStep ? visual.currentStep : i+1 < importStep ? visual.finishedStep : visual.pendingStep}>
        <span className={visual.stepNumber} aria-hidden="true">{i+1 < importStep ? "✓" : i+1}</span>{label}
      </li>)}
    </ol></nav>
    {!batchId && wizardStep === "source" && <section className={visual.wizardCard} aria-labelledby="choose-source-title">
      <h2 id="choose-source-title">Where are your products coming from?</h2>
      <p>Choose the source system. Each download has source-specific columns and an example row.</p>
      <div role="group" aria-label="Import source" className={visual.sourceChoices}>
        {([
          ["RENIVET","Renivet template","A spreadsheet prepared for Renivet"],
          ["SHOPIFY","Shopify","Products exported from Shopify"],
          ["UNICOMMERCE","Unicommerce","Catalogue exported from Unicommerce"],
          ["GENERIC","Other CSV","Map your own columns"],
        ] as const).map(([id,label,desc])=><button type="button" className={visual.sourceChoice} key={id} aria-pressed={profile===id} onClick={()=>chooseProfile(id)}>
          <span className={visual.sourceRadio} aria-hidden="true">{profile===id?"✓":""}</span><span><strong>{label}</strong><small>{desc}</small></span>
        </button>)}
      </div>
      <div className={visual.wizardFooter}><button type="button" className={styles.secondaryButton} onClick={()=>downloadTemplate(profile)}>Download {profile==="SHOPIFY"?"Shopify":profile==="UNICOMMERCE"?"Unicommerce":profile==="RENIVET"?"Renivet":"custom"} CSV template</button>
        <button type="button" className={styles.primaryButton} onClick={()=>setWizardStep("file")}>Continue to upload</button></div>
    </section>}
    {!batchId && wizardStep === "file" && <section className={visual.wizardCard} aria-labelledby="upload-title">
      <h2 id="upload-title">Upload your product file</h2><p>Keep source column names unchanged and replace the example row with real products. Choose the export for {profile==="UNICOMMERCE"?"Unicommerce":profile==="SHOPIFY"?"Shopify":profile==="RENIVET"?"Renivet":"a custom CSV"}.</p>
      <form onSubmit={startImport} noValidate>
        <div className={visual.dropArea}><label htmlFor="import-file">Choose a CSV or XLSX file</label>
          <input id="import-file" type="file" required accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event=>setFile(event.target.files?.[0]??null)}/>
          <small>{file ? file.name : "Up to 100 MiB. File is transferred through a private upload URL."}</small>
        </div>
        <div className={visual.formColumns}>
          <div className={styles.field}><label htmlFor="import-as-of">Export created on</label><input id="import-as-of" type="datetime-local" required value={sourceAsOf} onChange={event=>setSourceAsOf(event.target.value)}/></div>
          <div className={styles.field}><label htmlFor="import-conflicts">When products already exist</label><select id="import-conflicts" value={mode} onChange={event=>setMode(event.target.value as CreateRequest["mode"])}>
            <option value="REVIEW_CONFLICT">Review matches before updating</option><option value="CREATE_ONLY">Add only new products</option><option value="UPDATE_MATCHED">Update matched drafts</option><option value="SKIP_EXISTING">Skip existing products</option>
          </select></div>
          
        </div>
        {error&&<p className={styles.error} role="alert">{error}</p>}
        {notice&&<p className={styles.notice} role="status">{notice}</p>}
        <div className={visual.wizardFooter}><button type="button" className={styles.secondaryButton} onClick={()=>setWizardStep("source")} disabled={busy}>Back</button>
          <button type="submit" className={styles.primaryButton} disabled={busy||!file||!sourceAsOf}>{busy?"Uploading…":"Upload and continue"}</button></div>
      </form>
    </section>}
    {batchId && !preview && !results && <section className={visual.wizardCard} aria-labelledby="mapping-title">
      <h2 id="mapping-title">Match columns</h2><p>Confirm which column from your source file belongs to each Renivet field.</p>
      <form onSubmit={saveMapping}>
        <div className={styles.importMappingList}><div className={styles.mappingHeader}><span>Source column</span><span>Renivet field</span></div>
          {mappingRows.map(row=><div className={styles.mappingRow} key={row.id}><label className={styles.visuallyHidden} htmlFor={"source-"+row.id}>Source column</label><input id={"source-"+row.id} value={row.source} onChange={e=>setMappingRows(rows=>rows.map(item=>item.id===row.id?{...item,source:e.target.value}:item))}/><span aria-hidden="true">→</span>
            <label className={styles.visuallyHidden} htmlFor={"target-"+row.id}>Destination field</label><select id={"target-"+row.id} value={row.target} onChange={e=>setMappingRows(rows=>rows.map(item=>item.id===row.id?{...item,target:e.target.value}:item))}>
              <option value="">Skip this column</option>{targetFields.map(field=><option value={field} key={field}>{field}</option>)}</select>
            <button type="button" className={styles.textButton} onClick={()=>setMappingRows(rows=>rows.filter(item=>item.id!==row.id))}>Remove</button>
          </div>)}
        </div><button type="button" className={styles.textButton} onClick={addField}>Add another column</button>
        <h3>Source category mapping</h3>
        {categoryRows.map(row=><div className={styles.mappingRow} key={row.id}>
          <input aria-label="Source category" value={row.source} onChange={e=>setCategoryRows(rows=>rows.map(item=>item.id===row.id?{...item,source:e.target.value}:item))} />
          <span aria-hidden="true">→</span>
          <select aria-label="Renivet category" value={row.target} onChange={e=>setCategoryRows(rows=>rows.map(item=>item.id===row.id?{...item,target:e.target.value}:item))}>
            <option value="">Choose category</option>{selectable.map(c=><option value={c.code} key={c.id}>{categoryLabel(c,categories)}</option>)}
          </select><button type="button" className={styles.textButton} onClick={()=>setCategoryRows(rows=>rows.filter(item=>item.id!==row.id))}>Remove</button>
        </div>)}
        <button type="button" className={styles.textButton} onClick={addCategory}>Add category mapping</button>
        {categoryError&&<p className={styles.notice}>{categoryError}</p>}
        {error&&<p className={styles.error} role="alert">{error}</p>}
        {notice&&<p className={styles.notice} role="status">{notice}</p>}
        <div className={visual.wizardFooter}><button type="submit" className={styles.primaryButton} disabled={busy}>{busy?"Building preview…":"Review import preview"}</button></div>
      </form>
    </section>}
    {preview && !results && <section className={visual.wizardCard} aria-labelledby="preview-title">
      <h2 id="preview-title">Check your import</h2><p>Every parsed row can be saved now. Valid product data becomes an unpublished draft; rows with mismatched catalog details remain safely staged with their original fields.</p>
      <div className={styles.importCounts}>{Object.entries(preview.counts).map(([name,count])=><div key={name}><strong>{count}</strong><span>{name==="invalid"?"Needs editing":name==="review"?"Source staged":name==="conflict"?"Needs matching":name==="create"?"New draft":name==="update"?"Update draft":name}</span></div>)}</div>
      {preview.rows.some(row=>row.conflicts.length>0)&&<div className={visual.previewConflictSummary} role="status">
        <strong>No approval required to save this import</strong>
        <p>All parsed rows are accepted into private import staging. Create/Update rows may also be applied as drafts. Rows with category, option, or SKU mismatches stay staged for later editing, never published as valid products.</p>
      </div>}
      {preview.rows.length>0&&<div className={styles.tableWrap}><table className={styles.variantTable}>
        <caption className={styles.visuallyHidden}>Preview changes, conflicts, and how to fix them</caption>
        <thead><tr><th>CSV row</th><th>Result</th><th>Fields being changed</th><th>What needs attention and how to fix it</th></tr></thead>
        <tbody>{preview.rows.slice(0,100).map(row=><tr key={row.sourceRowNumber}>
          <td>{row.sourceRowNumber}</td><td>{["INVALID","CONFLICT","NEEDS_REVIEW"].includes(row.action)?"Save source for editing":row.action==="CREATE"?"Create private draft":row.action==="UPDATE"?"Update private draft":"No changes"}</td>
          <td>{row.fieldMask.join(", ")||"None"}</td>
          <td>{row.conflicts.length===0?"No issues found":<ul className={visual.previewConflictList}>
            {uniqueImportConflicts(row.conflicts.map(conflict=>conflict.code)).map(({message,occurrences})=><li key={message.code}>
              <strong>{message.title}{occurrences>1?" (reported "+occurrences+" times)":""}</strong>
              <span>{message.explanation}</span>
              <span><b>What to do:</b> {message.nextStep}</span>
              <small>Technical code: {message.code}</small>
            </li>)}
          </ul>}</td>
        </tr>)}</tbody>
      </table></div>}
      {preview.rows.length>100&&<p>Showing the first 100 rows. Check the full summary before confirming.</p>}
      <label className={visual.partialLabel}><input type="checkbox" checked={allowPartial} onChange={e=>setAllowPartial(e.target.checked)}/> Keep importing other rows if an individual draft operation fails</label>
      {error&&<p className={styles.error} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
      <div className={visual.wizardFooter}><button type="button" className={styles.secondaryButton} onClick={()=>setPreview(null)} disabled={busy}>Back to mapping</button><button type="button" className={styles.primaryButton} onClick={()=>void confirmImport()} disabled={busy}>{busy?"Saving…":"Save all import rows"}</button></div>
    </section>}
    {results && <section className={visual.wizardCard} aria-labelledby="results-title">
      <h2 id="results-title">Import results</h2><p>Imported source rows remain saved privately. Draft rows are not public; rows needing catalog corrections remain staged with their original values. No stock or live prices were changed.</p>
      {confirmation&&<div className={styles.importCounts}><div><strong>{confirmation.appliedRows}</strong><span>Draft rows applied</span></div><div><strong>{preview ? preview.counts.invalid+preview.counts.review+preview.counts.conflict : results.items.filter(row=>row.status==="STAGED").length}</strong><span>Saved for editing</span></div><div><strong>{confirmation.failedRows}</strong><span>Draft save failed</span></div><div><strong>{confirmation.noopRows}</strong><span>Unchanged</span></div></div>}
      <div className={styles.tableWrap}><table className={styles.variantTable}><thead><tr><th>Row</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>{results.items.map(row=><tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.status==="STAGED"?"Source saved · needs catalog edit":row.status==="APPLIED"?"Private draft saved":row.status.replaceAll("_"," ")}</td><td>{row.errorCodes.length===0?"No errors":<ul className={visual.previewConflictList}>{uniqueImportConflicts(row.errorCodes).map(({message,occurrences})=><li key={message.code}>
          <strong>{message.title}{occurrences>1?" (reported "+occurrences+" times)":""}</strong>
          <span>{message.explanation}</span>
          <span><b>What to do:</b> {message.nextStep}</span>
          <small>Technical code: {message.code}</small>
        </li>)}</ul>}</td></tr>)}</tbody>
      </table></div>
      {error&&<p className={styles.error} role="alert">{error}</p>}
      <div className={visual.wizardFooter}><button type="button" onClick={()=>void refreshResults()} disabled={busy} className={styles.secondaryButton}>Refresh results</button><button type="button" onClick={()=>void retryFailed()} disabled={busy||!results.items.some(row=>row.status==="FAILED")} className={styles.primaryButton}>Retry failed rows</button></div>
    </section>}
  </main>;
}
