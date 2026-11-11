"use client";

import { useEffect, useState } from "react";
import { AuthApiError, getCurrentSession, stepUpWithMfa } from "@/features/identity/auth-api";
import type { operations } from "@/generated/renivet-api";
import { categoryLabel, createIdempotencyKey, selectableCategories, type Category, type Paged, W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import { isStaleImportPreview, validateImportFieldMappings } from "@/features/seller/import-workspace-state";
import styles from "./product-workspace.module.css";

type UploadRequest = operations["beginCatalogImportUpload"]["requestBody"]["content"]["application/json"];
type UploadIntent = operations["beginCatalogImportUpload"]["responses"][201]["content"]["application/json"];
type CreateRequest = operations["createCatalogImport"]["requestBody"]["content"]["application/json"];
type MappingReceipt = operations["saveImportMapping"]["responses"][200]["content"]["application/json"];
type ImportPreview = operations["getCatalogImportPreview"]["responses"][200]["content"]["application/json"];
type Confirmation = operations["confirmCatalogImport"]["responses"][202]["content"]["application/json"];
type ImportResults = operations["getImportResults"]["responses"][200]["content"]["application/json"];
type SourceProfile = "SHOPIFY" | "UNICOMMERCE" | "RENIVET" | "GENERIC";
type MappingRow = { id: number; source: string; target: string };
type CategoryMappingRow = { id: number; source: string; target: string };

const maxImportBytes = 100 * 1024 * 1024;
const xlsxMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const targetFields = ["title", "styleCode", "sku", "categoryCode", "sourceProductKey", "sourceVariantKey", "sourceMrp", "imageUrl", "options.color", "options.size"];

const profileMappings: Record<SourceProfile, Array<[string, string]>> = {
  SHOPIFY: [["Handle", "sourceProductKey"], ["Title", "title"], ["Variant SKU", "sku"], ["Product Category", "categoryCode"], ["Option1 Value", "options.color"], ["Option2 Value", "options.size"], ["Variant Price", "sourceMrp"]],
  UNICOMMERCE: [["skuCode", "sku"], ["name", "title"], ["categoryCode", "categoryCode"], ["color", "options.color"], ["size", "options.size"], ["maxRetailPrice", "sourceMrp"], ["imageUrl", "imageUrl"]],
  RENIVET: [["styleCode", "styleCode"], ["title", "title"], ["sku", "sku"], ["categoryCode", "categoryCode"], ["color", "options.color"], ["size", "options.size"], ["mrp", "sourceMrp"]],
  GENERIC: [["title", "title"], ["styleCode", "styleCode"], ["sku", "sku"], ["categoryCode", "categoryCode"]],
};

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
  const [mfaCode, setMfaCode] = useState("");
  const [allowPartial, setAllowPartial] = useState(false);
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
    if (!/^(?:\d{6}|[A-Z2-7]{26})$/.test(mfaCode.trim().toUpperCase())) throw new Error("Enter a six-digit authenticator code or unused recovery code.");
    const session = await getCurrentSession();
    const response = await stepUpWithMfa(mfaCode.trim().toUpperCase(), session.csrfToken);
    setMfaCode("");
    return response.csrfToken;
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
      if (uploadUrl.protocol !== "https:" || intent.uploadMethod !== "PUT") throw new Error("The private upload intent is invalid.");
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
      setResults(status); setNotice(result.state === "PARTIAL" ? "Import finished with both successful and failed rows. Successful rows are retained." : "Import results are ready.");
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

  function addField() { setMappingRows((rows) => [...rows, { id: nextRowId, source: "", target: "" }]); setNextRowId((id) => id + 1); }
  function addCategory() { setCategoryRows((rows) => [...rows, { id: nextRowId, source: "", target: "" }]); setNextRowId((id) => id + 1); }

  return <main className={styles.page} aria-labelledby="imports-title">
    <nav className={styles.detailBreadcrumb} aria-label="Breadcrumb"><a href={`/brands/${encodeURIComponent(brandId)}/products`}>Products</a><span aria-hidden="true">/</span><span>Imports</span></nav>
    <header className={styles.header}><div><p className={styles.kicker}>BRAND WORKSPACE / DATA IMPORT</p><h1 id="imports-title">Import products safely</h1><p className={styles.subtitle}>Upload privately, map columns, review a frozen preview, then confirm explicitly.</p></div><span className={styles.draftBadge}>NO STOCK WRITES</span></header>
    {!batchId ? <section className={styles.formPanel} aria-labelledby="upload-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>STEP 1 · SOURCE</p><h2 id="upload-heading">Choose an export</h2><p>CSV and XLSX files are uploaded to private storage using a short-lived signed URL. The import only stages catalogue data until you confirm.</p></div></div>
      <form onSubmit={startImport} noValidate><div className={styles.formGrid}>
        <div className={styles.field}><label htmlFor="import-profile">Source profile</label><select id="import-profile" value={profile} onChange={(event) => { const selected = event.target.value as SourceProfile; setProfile(selected); setMappingRows(profileMappings[selected].map(([source, target], id) => ({ id, source, target }))); }}>{(["UNICOMMERCE", "SHOPIFY", "RENIVET", "GENERIC"] as SourceProfile[]).map((item) => <option key={item} value={item}>{item === "UNICOMMERCE" ? "Unicommerce / Uniware" : item === "SHOPIFY" ? "Shopify" : item}</option>)}</select><small>XLSX uploads use the backend’s RENIVET_XLSX source contract; edit mappings below to fit the selected export.</small></div>
        <div className={styles.field}><label htmlFor="import-mode">Conflict handling</label><select id="import-mode" value={mode} onChange={(event) => setMode(event.target.value as CreateRequest["mode"])}><option value="REVIEW_CONFLICT">Review conflicts before changes</option><option value="CREATE_ONLY">Create new records only</option><option value="UPDATE_MATCHED">Update matched records</option><option value="SKIP_EXISTING">Skip records that already exist</option></select></div>
        <div className={styles.fieldWide}><label htmlFor="import-file">Source file</label><input id="import-file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><small>CSV or XLSX, up to 100 MiB. File contents are never placed in the URL or application logs.</small></div>
        <div className={styles.field}><label htmlFor="source-as-of">Export created at</label><input id="source-as-of" type="datetime-local" value={sourceAsOf} onChange={(event) => setSourceAsOf(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="import-mfa">Authenticator or recovery code</label><input id="import-mfa" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} maxLength={26} /><small>Required for private file access and import mutations.</small></div>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
      <div className={styles.formActions}><p>Available active categories: {categoryError || selectable.length}</p><button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Uploading and staging…" : "Upload and start mapping"}</button></div>
      </form>
    </section> : <>
      <section className={styles.formPanel} aria-labelledby="mapping-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>STEP 2 · FIELD MAPPING</p><h2 id="mapping-heading">Match source columns</h2><p>Edit the sample mappings to match your file. Keep source column names exact. Each destination may be used once.</p></div><span className={styles.draftBadge}>BATCH {batchId.slice(0, 8)}</span></div>
        <form onSubmit={saveMapping}><div className={styles.importMappingList}><div className={styles.mappingHeader}><span>Source column</span><span>Renivet field</span></div>{mappingRows.map((row) => <div className={styles.mappingRow} key={row.id}><label className={styles.visuallyHidden} htmlFor={`source-${row.id}`}>Source column name</label><input id={`source-${row.id}`} value={row.source} onChange={(event) => setMappingRows((rows) => rows.map((item) => item.id === row.id ? { ...item, source: event.target.value } : item))} placeholder="Exact source header" /><span aria-hidden="true">→</span><label className={styles.visuallyHidden} htmlFor={`target-${row.id}`}>Renivet destination field</label><select id={`target-${row.id}`} value={row.target} onChange={(event) => setMappingRows((rows) => rows.map((item) => item.id === row.id ? { ...item, target: event.target.value } : item))}><option value="">Skip this source column</option>{targetFields.map((field) => <option key={field} value={field}>{field}</option>)}</select><button type="button" className={styles.textButton} onClick={() => setMappingRows((rows) => rows.filter((item) => item.id !== row.id))}>Remove</button></div>)}</div>
          <button type="button" className={styles.textButton} onClick={addField}>Add field mapping</button>
          <div className={styles.schemaPanel}><div><p className={styles.kicker}>CATEGORY MATCHING</p><h3>Map source categories</h3><p>Use the exact category text from your export and choose an active leaf category.</p></div><div className={styles.categoryMappingList}>{categoryRows.map((row) => <div className={styles.mappingRow} key={row.id}><label className={styles.visuallyHidden} htmlFor={`category-source-${row.id}`}>Source category</label><input id={`category-source-${row.id}`} value={row.source} onChange={(event) => setCategoryRows((rows) => rows.map((item) => item.id === row.id ? { ...item, source: event.target.value } : item))} placeholder="Source category" /><span aria-hidden="true">→</span><label className={styles.visuallyHidden} htmlFor={`category-target-${row.id}`}>Renivet leaf category</label><select id={`category-target-${row.id}`} value={row.target} onChange={(event) => setCategoryRows((rows) => rows.map((item) => item.id === row.id ? { ...item, target: event.target.value } : item))}><option value="">Choose a leaf category</option>{selectable.map((category) => <option key={category.id} value={category.code}>{categoryLabel(category, categories)}</option>)}</select><button type="button" className={styles.textButton} onClick={() => setCategoryRows((rows) => rows.filter((item) => item.id !== row.id))}>Remove</button></div>)}</div><button type="button" className={styles.textButton} onClick={addCategory}>Add category mapping</button></div>
          <div className={styles.field}><label htmlFor="mapping-mfa">Authenticator or recovery code</label><input id="mapping-mfa" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} maxLength={26} /></div>
          {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
          <div className={styles.formActions}><p>Saving creates an immutable preview revision.</p><button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Building preview…" : "Save mapping and preview"}</button></div>
        </form>
      </section>
      {preview && <section className={styles.formPanel} aria-labelledby="preview-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>STEP 3 · IMMUTABLE PREVIEW</p><h2 id="preview-heading">Review before confirming</h2><p>Revision {preview.previewRevision} · hash {preview.previewHash.slice(0, 12)}… · source {preview.sourceSha256.slice(0, 12)}…</p></div><span className={styles.draftBadge}>FROZEN</span></div>
        <div className={styles.importCounts}>{Object.entries(preview.counts).map(([name, count]) => <div key={name}><strong>{count}</strong><span>{name}</span></div>)}</div>
        {preview.rows.length > 0 && <div className={styles.tableWrap}><table className={styles.variantTable}><caption className={styles.visuallyHidden}>Import preview actions and conflicts</caption><thead><tr><th scope="col">Row</th><th scope="col">Action</th><th scope="col">Fields to change</th><th scope="col">Conflict codes</th></tr></thead><tbody>{preview.rows.slice(0, 100).map((row) => <tr key={row.sourceRowNumber}><th scope="row">{row.sourceRowNumber}</th><td>{row.action.replaceAll("_", " ")}</td><td>{row.fieldMask.join(", ") || "None"}</td><td>{row.conflicts.map((item) => item.code).join(", ") || "None"}</td></tr>)}</tbody></table></div>}
        {preview.rows.length > 100 && <p className={styles.inlineError}>Showing the first 100 preview rows. Review totals for the full batch before confirming.</p>}
        <label className={styles.checkboxLabel}><input type="checkbox" checked={allowPartial} onChange={(event) => setAllowPartial(event.target.checked)} /> Allow valid rows to continue if some rows fail. Successful row results remain recorded.</label>
        <div className={styles.field}><label htmlFor="confirm-mfa">Authenticator or recovery code</label><input id="confirm-mfa" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} maxLength={26} /></div>
        {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
        <div className={styles.formActions}><p>Confirm applies only this frozen preview.</p><button type="button" className={styles.primaryButton} disabled={busy} onClick={confirmImport}>{busy ? "Confirming…" : "Confirm import"}</button></div>
      </section>}
      {confirmation && <section className={styles.formPanel} aria-labelledby="results-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>STEP 4 · RESULTS</p><h2 id="results-heading">Import {confirmation.state.toLowerCase()}</h2><p>{confirmation.appliedRows} successful · {confirmation.failedRows} failed · {confirmation.noopRows} unchanged</p></div><span className={styles.draftBadge}>{confirmation.state}</span></div>
        {results && <div className={styles.tableWrap}><table className={styles.variantTable}><caption className={styles.visuallyHidden}>Redacted import row results</caption><thead><tr><th scope="col">Row</th><th scope="col">Status</th><th scope="col">Error codes</th><th scope="col">Effect receipts</th></tr></thead><tbody>{results.items.map((item) => <tr key={item.rowNumber}><th scope="row">{item.rowNumber}</th><td>{item.status.replaceAll("_", " ")}</td><td>{item.errorCodes.join(", ") || "None"}</td><td>{item.effectReceiptIds.length}</td></tr>)}</tbody></table></div>}
        {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
        <div className={styles.formActions}><button type="button" className={styles.secondaryButton} disabled={busy} onClick={refreshResults}>Refresh results</button><button type="button" className={styles.primaryButton} disabled={busy || !results?.items.some((item) => item.status === "FAILED")} onClick={retryFailed}>Retry failed rows only</button></div>
      </section>}
    </>}
  </main>;
}
