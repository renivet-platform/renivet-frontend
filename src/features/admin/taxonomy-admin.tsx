"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentSession, stepUpWithMfa } from "@/features/identity/auth-api";
import { shouldRequestMfaStepUp } from "@/features/identity/mfa-policy";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./taxonomy-admin.module.css";

type Category = { id: string; code: string; name: string; active?: boolean; isActive?: boolean; schemaVersion?: number | null; currentSchemaVersion?: number | null; isLeaf: boolean; hasDraft?: boolean };
type Attribute = { id?: string; code: string; label?: string; valueType?: string; type?: string; scopeType?: string; scope?: string; allowedValues?: unknown; unitCode?: string | null };
type SelectedAttribute = { code: string; required: boolean };
const validatorVersion = "w2-attribute-validator-v1";
const friendlyError = (cause: unknown) => cause instanceof W2ApiError
  ? cause.status === 401 ? "Your session expired. Sign in and try again."
  : cause.status === 403 ? "You need permission to create this category update."
  : cause.status === 409 ? "This category changed. Refresh and try again."
  : cause.message
  : cause instanceof Error ? cause.message : "Unable to save your change. Try again.";

export function TaxonomyAdminWorkspace() {
  const [categories,setCategories] = useState<Category[]>([]);
  const [attributes,setAttributes] = useState<Attribute[]>([]);
  const [categoryId,setCategoryId] = useState("");
  const [fields,setFields] = useState<SelectedAttribute[]>([]);
  const [step,setStep] = useState<"choose" | "review">("choose");
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [mfaRequired,setMfaRequired] = useState(false);
  const [mfaCode,setMfaCode] = useState("");
  const [search,setSearch] = useState("");
  const selected = useMemo(() => categories.find(x => x.id === categoryId),[categoryId,categories]);
  const available = useMemo(() => categories.filter(x => x.isLeaf && (x.name + " " + x.code).toLowerCase().includes(search.toLowerCase())),[categories,search]);
  const version = (selected?.currentSchemaVersion ?? selected?.schemaVersion ?? 0) + 1;

  async function load() {
    setLoading(true); setError("");
    try {
      const [categoryResponse,attributeResponse,session] = await Promise.all([
        w2Request<{items:Category[]}>(["admin","catalog","categories"]),
        w2Request<{items:Attribute[]}>(["admin","catalog","categories","attributes"]),
        getCurrentSession()
      ]);
      setCategories(categoryResponse.items ?? []);
      setAttributes(attributeResponse.items ?? []);
      setMfaRequired(shouldRequestMfaStepUp(session.mfaEnforcementMode));
    } catch(cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function chooseCategory(id:string) {
    setCategoryId(id); setFields([]); setStep("choose"); setNotice(""); setError("");
  }
  function toggleField(code:string) {
    setFields(current => current.some(f => f.code === code) ? current.filter(f => f.code !== code) : [...current,{code,required:false}]);
  }
  function prepare() {
    if (!selected) { setError("Choose a category first."); return; }
    if (!selected.isLeaf) { setError("Choose a specific category rather than a parent group."); return; }
    if (selected.hasDraft) { setError("A draft is already waiting for review. Open the approval queue."); return; }
    if (fields.length === 0) { setError("Choose at least one product detail."); return; }
    if (fields.some(f => !attributes.some(a => a.code === f.code && a.id))) { setError("Some fields do not have a saved definition. Refresh the page."); return; }
    setError(""); setStep("review");
  }
  async function submit() {
    if (!selected || step !== "review" || busy) return;
    setBusy(true);setError("");setNotice("");
    try {
      const session = await getCurrentSession();
      const requireMfa = shouldRequestMfaStepUp(session.mfaEnforcementMode);
      setMfaRequired(requireMfa);
      let csrfToken = session.csrfToken;
      if (requireMfa) {
        if (!/^(?:\d{6}|[A-Z2-7]{26})$/.test(mfaCode.trim().toUpperCase())) throw new Error("Enter your authenticator code to continue.");
        const elevated = await stepUpWithMfa(mfaCode.trim().toUpperCase(), csrfToken);
        csrfToken = elevated.csrfToken;
      }
      const ruleset = { attributes: fields.map(field => {
        const source = attributes.find(a => a.code === field.code)!;
        return {
          attributeId:source.id,
          code:source.code,
          scope:source.scopeType ?? source.scope ?? "product",
          valueType:source.valueType ?? source.type ?? "text",
          requiredByDefault:field.required,
          ...(source.allowedValues == null ? {} : {allowedValues:source.allowedValues}),
          ...(source.unitCode ? {unitCode:source.unitCode} : {})
        };
      }) };
      await w2Request(["admin","catalog","categories",selected.id,"schema-versions"],{
        method:"POST",body:{categoryId:selected.id,version,ruleset,validatorVersion},
        csrfToken,idempotencyKey:crypto.randomUUID()
      });
      setNotice("Submitted for approval. Another authorized admin can review and publish this update.");
      setStep("choose");setFields([]);setMfaCode("");
      await load();
    } catch(cause) { setError(friendlyError(cause)); }
    finally { setBusy(false); }
  }
  return <main className={styles.simplePage} data-screen-id="AD-07">
    <header className={styles.simpleHeader}>
      <div><p className={styles.simpleEyebrow}>CATALOGUE SETTINGS</p><h1>Taxonomy</h1><p>Manage the categories and product details brands use.</p></div>
      <Link href="/operations/taxonomy" className={styles.reviewLink}>Review requests</Link>
    </header>
    <div className={styles.simpleSteps} aria-label="Category update workflow">
      <span className={step==="choose"?styles.stepActive:styles.step}>1. Create update</span>
      <span className={step==="review"?styles.stepActive:styles.step}>2. Review details</span>
      <span className={styles.step}>3. Another admin approves</span>
    </div>
    {error && <div className={styles.simpleError} role="alert">{error} <button type="button" onClick={()=>void load()}>Refresh</button></div>}
    {notice && <div className={styles.simpleSuccess} role="status">{notice} <Link href="/operations/taxonomy">View approval queue</Link></div>}
    {loading ? <p role="status">Loading categories and details…</p> : <div className={styles.simpleGrid}>
      <section className={styles.simpleCard} aria-labelledby="category-list-heading">
        <h2 id="category-list-heading">Choose a category</h2>
        <p>Select the category you want to update.</p>
        <input aria-label="Search categories" className={styles.searchBox} placeholder="Search categories" value={search} onChange={e=>setSearch(e.currentTarget.value)} />
        <div className={styles.simpleCategoryList}>
          {available.map(category=><button type="button" key={category.id} className={categoryId===category.id?styles.categorySelected:styles.categoryOption} onClick={()=>chooseCategory(category.id)}>
            <strong>{category.name}</strong>
            <small>{category.active===false||category.isActive===false?"Not active":"Active"} · {category.hasDraft?"Awaiting approval":category.schemaVersion?"Version "+category.schemaVersion:"No published version"}</small>
          </button>)}
          {!available.length && <p>No matching categories.</p>}
        </div>
      </section>
      <section className={styles.simpleCard} aria-labelledby="category-editor-heading">
        <h2 id="category-editor-heading">{selected ? selected.name : "Create a category update"}</h2>
        {!selected ? <p>Choose a category on the left to get started. New category creation is not available through the current backend API.</p>
        : selected.hasDraft ? <div className={styles.simpleSuccess}>An update is already awaiting approval. <Link href="/operations/taxonomy">Review request</Link></div>
        : step==="choose" ? <>
            <p>Choose which details a brand must provide when listing products here.</p>
            <div className={styles.simpleFieldList}>
              {attributes.map(attribute=>{const chosen=fields.find(f=>f.code===attribute.code);return <div className={styles.simpleField} key={attribute.code}>
                <label><input type="checkbox" checked={Boolean(chosen)} onChange={()=>toggleField(attribute.code)} disabled={!attribute.id}/><span>{attribute.label||attribute.code}</span></label>
                {chosen&&<label className={styles.requiredToggle}><input type="checkbox" checked={chosen.required} onChange={e=>setFields(v=>v.map(f=>f.code===chosen.code?{...f,required:e.currentTarget.checked}:f))}/>Required</label>}
              </div>})}
              {!attributes.length&&<p>No saved product details found.</p>}
            </div>
            <button className={styles.simplePrimary} disabled={!fields.length} type="button" onClick={prepare}>Review update</button>
          </> : <>
            <p>Please check this update before sending it to another admin for approval.</p>
            <div className={styles.reviewSummary}><strong>{selected.name} · Version {version}</strong>
              {fields.map(field=><div key={field.code}>{attributes.find(a=>a.code===field.code)?.label||field.code}<span>{field.required?"Required":"Optional"}</span></div>)}
            </div>
            {mfaRequired&&<label className={styles.mfaLabel}>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={e=>setMfaCode(e.currentTarget.value)} placeholder="Enter code" /></label>}
            <div className={styles.simpleActions}><button type="button" className={styles.simpleSecondary} disabled={busy} onClick={()=>setStep("choose")}>Back</button><button className={styles.simplePrimary} type="button" disabled={busy} onClick={()=>void submit()}>{busy?"Submitting…":"Send for approval"}</button></div>
          </>}
      </section>
    </div>}
    <p className={styles.simpleFooter}>Approval is always completed by a different authorized admin. Published changes are stored by the backend.</p>
  </main>;
}
