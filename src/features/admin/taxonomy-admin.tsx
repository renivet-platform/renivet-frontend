"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentSession } from "@/features/identity/auth-api";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./taxonomy-admin.module.css";

type StoredRule = { code: string; requiredByDefault?: boolean; [key: string]: unknown };
type Category = { id: string; code: string; name: string; parentId?: string | null; active?: boolean; isActive?: boolean; retired?: boolean; schemaVersion?: number | null; currentSchemaVersion?: number | null; publishedRuleset?: { attributes?: StoredRule[]; [key: string]: unknown } | null; isLeaf: boolean; hasDraft?: boolean };
type Attribute = { id?: string; code: string; label?: string; valueType?: string; type?: string; scopeType?: string; scope?: string; allowedValues?: unknown; unitCode?: string | null };
type ImportCategoryRequest = { id: string; brandId: string; sourceCode: string; name: string; firstSourceRow: number; createdAt: string };
type SelectedAttribute = { code: string; required: boolean };
const validatorVersion = "w2-attribute-validator-v1";
function isLive(category: Category) { return category.active === true || category.isActive === true; }
function currentVersion(category: Category) { return category.schemaVersion ?? category.currentSchemaVersion ?? null; }
function categoryStatus(category: Category): { label: string; tone: "live" | "ready" | "waiting" | "setup" | "retired"; note: string } {
  if (category.retired) return { label: "Retired", tone: "retired", note: "Previously deactivated" };
  if (isLive(category)) return { label: "Live", tone: "live", note: category.hasDraft ? "Update awaiting approval" : "Available to brands" };
  if (currentVersion(category) != null) return { label: "Ready to activate", tone: "ready", note: "Approved — not live yet" };
  if (category.hasDraft) return { label: "Waiting for approval", tone: "waiting", note: "Another admin must review" };
  return { label: "Needs details", tone: "setup", note: "Select product details" };
}
function savedSelection(category: Category | undefined): SelectedAttribute[] {
  return (category?.publishedRuleset?.attributes ?? []).filter(rule => typeof rule.code === "string").map(rule => ({ code: rule.code, required: rule.requiredByDefault === true }));
}
const friendlyError = (cause: unknown) => cause instanceof W2ApiError
  ? cause.status === 401 ? "Your session expired. Sign in and try again."
  : cause.status === 403 ? "You need permission to create this category update."
  : cause.status === 409 ? "This category changed. Refresh and try again."
  : cause.message
  : cause instanceof Error ? cause.message : "Unable to save your change. Try again.";

export function TaxonomyAdminWorkspace() {
  const [categories,setCategories] = useState<Category[]>([]);
  const [attributes,setAttributes] = useState<Attribute[]>([]);
  const [importCategoryRequests,setImportCategoryRequests] = useState<ImportCategoryRequest[]>([]);
  const [categoryId,setCategoryId] = useState("");
  const [fields,setFields] = useState<SelectedAttribute[]>([]);
  const [step,setStep] = useState<"choose" | "review">("choose");
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [search,setSearch] = useState("");
  const [creating,setCreating] = useState(false);
  const [editing,setEditing] = useState(false);
  const [confirmActivation,setConfirmActivation] = useState(false);
  const [filter,setFilter] = useState<"all" | "action" | "live">("all");
  const [newName,setNewName] = useState("");
  const [newCode,setNewCode] = useState("");
  const [newParentId,setNewParentId] = useState("");
  const selected = useMemo(() => categories.find(x => x.id === categoryId),[categoryId,categories]);
  const pendingCategories = useMemo(() => categories.filter(category => category.hasDraft), [categories]);
  const leafCategories = useMemo(() => categories.filter(category => category.isLeaf), [categories]);
  const available = useMemo(() => leafCategories.filter(category => (category.name + " " + category.code).toLowerCase().includes(search.toLowerCase()) &&
    (filter === "all" || (filter === "live" ? isLive(category) : !isLive(category) && !category.retired))), [leafCategories, search, filter]);
  const liveCount = leafCategories.filter(isLive).length;
  const readyCategories = leafCategories.filter(category => !isLive(category) && !category.retired && currentVersion(category) != null);
  const waitingCount = leafCategories.filter(category => category.hasDraft).length;
  const version = (selected?.currentSchemaVersion ?? selected?.schemaVersion ?? 0) + 1;

  async function load() {
    setLoading(true); setError("");
    try {
      const [categoryResponse,attributeResponse,requestResponse] = await Promise.all([
        w2Request<{items:Category[]}>(["admin","catalog","categories"]),
        w2Request<{items:Attribute[]}>(["admin","catalog","categories","attributes"]),
        w2Request<{items:ImportCategoryRequest[]}>(["admin","catalog","import-category-requests"]).catch(()=>({items: [] as ImportCategoryRequest[]}))
      ]);
      const loaded = categoryResponse.items ?? [];
      setCategories(loaded);
      setAttributes(attributeResponse.items ?? []);
      setImportCategoryRequests(requestResponse.items ?? []);
      // Prioritize the next actionable item when first opening the workspace.
      if (!categoryId) {
        const firstReady = loaded.find(category => category.isLeaf && !isLive(category) && !category.retired && currentVersion(category) != null);
        const first = firstReady ?? loaded.find(category => category.isLeaf);
        if (first) { setCategoryId(first.id); setFields(savedSelection(first)); }
      }
    } catch(cause) { setError(friendlyError(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function chooseCategory(id:string) {
    setCategoryId(id); setFields(savedSelection(categories.find(category => category.id === id)));
    setStep("choose"); setEditing(false); setConfirmActivation(false); setNotice(""); setError("");
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
  async function createCategory() {
    if(busy)return;
    const name=newName.trim(),code=newCode.trim();
    if(name.length<3||name.length>100||!/^[a-z][a-z0-9_]{2,63}$/.test(code)){
      setError("Enter a category name and a simple code using lowercase letters, numbers or underscores.");return;
    }
    setBusy(true);setError("");setNotice("");
    try {
      const session=await getCurrentSession();
      const csrfToken=session.csrfToken;
      const result=await w2Request<{id:string;status:string}>(["admin","catalog","categories"],{
        method:"POST",body:{name,code,...(newParentId?{parentId:newParentId}:{})},
        csrfToken,idempotencyKey:crypto.randomUUID()
      });
      setCreating(false);setNewName("");setNewCode("");setNewParentId("");
      await load();
      setCategoryId(result.id);setFields([]);setStep("choose");setEditing(true);setConfirmActivation(false);
      setNotice("Category created. Select the product details below and send the first version for approval.");
    } catch(cause){setError(friendlyError(cause));}
    finally{setBusy(false);}
  }

  async function submit() {
    if (!selected || step !== "review" || busy) return;
    setBusy(true);setError("");setNotice("");
    try {
      const session = await getCurrentSession();
      const csrfToken = session.csrfToken;
      // Retain immutable published rule details (conditional logic, value limits, units)
      // when preparing a revision; the simple editor only changes membership/requiredness.
      const ruleset = { ...(selected.publishedRuleset ?? {}), attributes: fields.map(field => {
        const publishedRule = selected.publishedRuleset?.attributes?.find(rule => rule.code === field.code);
        if (publishedRule) return { ...publishedRule, requiredByDefault: field.required };
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
      setStep("choose");setEditing(false);setFields([]);
      await load();
    } catch(cause) { setError(friendlyError(cause)); }
    finally { setBusy(false); }
  }
  async function activateCategory() {
    if (!selected || busy || isLive(selected) || selected.retired || currentVersion(selected) == null) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const session = await getCurrentSession();
      await w2Request(["admin","catalog","categories",selected.id,"activate"], {
        method: "POST",
        body: { reasonCode: "APPROVED_FOR_LISTING" },
        csrfToken: session.csrfToken,
        idempotencyKey: crypto.randomUUID()
      });
      setConfirmActivation(false);
      await load();
      setNotice(`${selected.name} is now active. Brands can use its published details when listing products.`);
    } catch (cause) {
      if (cause instanceof W2ApiError && cause.status === 409) {
        setError("This category has changed or cannot be activated. Refresh to check the latest status.");
      } else { setError(friendlyError(cause)); }
    } finally { setBusy(false); }
  }
  return <main className={styles.simplePage} data-screen-id="AD-07">
    <header className={styles.simpleHeader}>
      <div><p className={styles.simpleEyebrow}>CATALOGUE SETTINGS</p><h1>Taxonomy</h1><p>Create product categories, approve their details and make them available to brands.</p></div>
      <div className={styles.headerActions}><button type="button" className={styles.simplePrimary} onClick={()=>{setCreating(true);setError("");}}>+ Create category</button><Link href="/operations/taxonomy" className={styles.reviewLink}>Review requests</Link></div>
    </header>
    {!loading && <div className={styles.summaryGrid} aria-label="Category progress">
      <div className={styles.summaryMetric}><span className={styles.metricDotLive} aria-hidden="true"/><strong>{liveCount}</strong><span>Live categories</span></div>
      <div className={styles.summaryMetric}><span className={styles.metricDotReady} aria-hidden="true"/><strong>{readyCategories.length}</strong><span>Ready to activate</span>{readyCategories.length > 0 && <button type="button" onClick={() => chooseCategory(readyCategories[0].id)}>View next <span aria-hidden="true">→</span></button>}</div>
      <div className={styles.summaryMetric}><span className={styles.metricDotWaiting} aria-hidden="true"/><strong>{waitingCount}</strong><span>Awaiting approval</span></div>
    </div>}
    {!loading && pendingCategories.length > 0 && <section className={styles.pendingBanner} aria-labelledby="pending-taxonomy-title">
      <div><h2 id="pending-taxonomy-title">Waiting for a second admin</h2><p>{pendingCategories.length === 1 ? "A category update has been submitted and is awaiting independent approval." : `${pendingCategories.length} category updates have been submitted and are awaiting independent approval.`}</p>
        <div className={styles.pendingNames}>{pendingCategories.slice(0,3).map(category => <button key={category.id} type="button" onClick={() => chooseCategory(category.id)}>{category.name} <span>· Pending</span></button>)}{pendingCategories.length > 3 && <span>+{pendingCategories.length - 3} more</span>}</div>
      </div><Link href="/operations/taxonomy" className={styles.simplePrimary}>Open review queue</Link>
    </section>}
    {!loading && importCategoryRequests.length>0 && <section className={styles.pendingBanner} aria-labelledby="import-category-requests-heading">
      <div><h2 id="import-category-requests-heading">Categories requested by product imports</h2>
        <p>Products from these uploads are saved privately. Set up the missing category when ready; it will not become live until its normal approval and activation checks are complete.</p>
        <div className={styles.pendingNames}>
          {importCategoryRequests.slice(0,10).map(request=><button key={request.id} type="button" onClick={()=>{
            const raw=request.sourceCode.toLowerCase().replace(/[^a-z0-9_]+/g,"_").replace(/^_+|_+$/g,"").slice(0,64);
            setNewCode(raw.length>=3?raw:("category_"+raw).slice(0,64));
            setNewName(request.name.slice(0,100));
            setCreating(true);setError("");
          }} disabled={categories.some(category=>category.code.toLowerCase()===request.sourceCode.toLowerCase())}>
            {request.name} <span>· {categories.some(category=>category.code.toLowerCase()===request.sourceCode.toLowerCase())?"Already created":"Create category"}</span>
          </button>)}
        </div>
      </div>
    </section>}
    {error && <div className={styles.simpleError} role="alert">{error} <button type="button" onClick={()=>void load()}>Refresh</button></div>}
    {notice && <div className={styles.simpleSuccess} role="status">{notice} <Link href="/operations/taxonomy">View approval queue</Link></div>}
    {creating && <section className={styles.createPanel} aria-labelledby="new-category-title">
      <h2 id="new-category-title">Create a category</h2>
      <p>Give it a clear name. It will stay inactive until another admin approves its details.</p>
      <div className={styles.createForm}>
        <label>Category name<input value={newName} maxLength={100} onChange={e=>{
          const v=e.currentTarget.value;setNewName(v);setNewCode(v.toLowerCase().trim().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,64));
        }} placeholder="Example: Home textiles"/></label>
        <label>Category code<input value={newCode} maxLength={64} onChange={e=>setNewCode(e.currentTarget.value.toLowerCase())} placeholder="home_textiles"/></label>
        <label>Under (optional)<select value={newParentId} onChange={e=>setNewParentId(e.currentTarget.value)}>
          <option value="">Top-level category</option>
          {categories.filter(c=>!c.isLeaf && !c.active && !c.isActive && !c.schemaVersion).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
      </div>
      <div className={styles.simpleActions}><button type="button" className={styles.simpleSecondary} disabled={busy} onClick={()=>setCreating(false)}>Cancel</button><button type="button" className={styles.simplePrimary} disabled={busy||newName.trim().length<3} onClick={()=>void createCategory()}>{busy?"Creating…":"Create and continue"}</button></div>
    </section>}
    {loading ? <p role="status">Loading categories and details…</p> : <div className={styles.simpleGrid}>
      <section className={styles.simpleCard} aria-labelledby="category-list-heading">
        <h2 id="category-list-heading">Your categories</h2>
        <p>Choose one to see its next step.</p>
        <input aria-label="Search categories" className={styles.searchBox} placeholder="Search by category name" value={search} onChange={e=>setSearch(e.currentTarget.value)} />
        <div className={styles.categoryFilters} role="group" aria-label="Filter categories">
          <button type="button" className={filter==="all"?styles.filterActive:styles.filterButton} aria-pressed={filter==="all"} onClick={()=>setFilter("all")}>All</button>
          <button type="button" className={filter==="action"?styles.filterActive:styles.filterButton} aria-pressed={filter==="action"} onClick={()=>setFilter("action")}>Needs action</button>
          <button type="button" className={filter==="live"?styles.filterActive:styles.filterButton} aria-pressed={filter==="live"} onClick={()=>setFilter("live")}>Live</button>
        </div>
        <div className={styles.simpleCategoryList}>
          {available.map(category=>{const status=categoryStatus(category);return <button type="button" key={category.id} aria-pressed={categoryId===category.id} className={categoryId===category.id?styles.categorySelected:styles.categoryOption} onClick={()=>chooseCategory(category.id)}>
            <span className={styles.categoryRowTop}><strong>{category.name}</strong><span className={styles.statusPill} data-tone={status.tone}>{status.label}</span></span>
            <small>{status.note}{currentVersion(category)!=null ? ` · Version ${currentVersion(category)}` : ""}</small>
          </button>;})}
          {!available.length && <p className={styles.emptyList}>No categories match. Try a different search or filter.</p>}
        </div>
      </section>
      <section className={styles.simpleCard} aria-labelledby="category-editor-heading">
        <div className={styles.detailHeader}>
          <div><p className={styles.detailEyebrow}>CATEGORY DETAILS</p><h2 id="category-editor-heading">{selected ? selected.name : "Select a category"}</h2></div>
          {selected && <span className={styles.statusPill} data-tone={categoryStatus(selected).tone}>{categoryStatus(selected).label}</span>}
        </div>
        {!selected ? <div className={styles.welcomePanel}><strong>Choose a category to get started</strong><p>Select one from the list, or create a new category using the button above.</p></div> :
        <>
          {selected.retired ? <div className={styles.statePanel} role="status"><h3>This category has been retired</h3><p>A retired category cannot be made active again. Create a new category if you need to resume listings.</p></div> : null}
          {isLive(selected) && <div className={styles.livePanel} role="status"><span className={styles.stateIcon} aria-hidden="true">✓</span><div><h3>Category is live</h3><p>Brands can select this category when listing products. Version {currentVersion(selected)} is published.</p>{selected.hasDraft && <p>An updated version is also awaiting another admin’s approval.</p>}</div></div>}
          {!isLive(selected) && !selected.retired && currentVersion(selected) != null && <div className={styles.activatePanel}>
            <div className={styles.activationIntro}><span className={styles.stateIcon} aria-hidden="true">✓</span><div><h3>Approved — ready to go live</h3><p>Version {currentVersion(selected)} is published. One final step remains: activate this category so brands can use it.</p></div></div>
            {!confirmActivation ? <button type="button" className={styles.simplePrimary} disabled={busy} onClick={()=>setConfirmActivation(true)}>Activate category <span aria-hidden="true">→</span></button>
              : <div className={styles.confirmPanel} role="group" aria-label="Confirm category activation"><strong>Make {selected.name} available to brands?</strong><p>This uses the approved version and records an audit event.</p><div className={styles.simpleActions}><button type="button" className={styles.simpleSecondary} disabled={busy} onClick={()=>setConfirmActivation(false)}>Cancel</button><button type="button" className={styles.simplePrimary} disabled={busy} onClick={()=>void activateCategory()}>{busy?"Activating…":"Yes, make live"}</button></div></div>}
            {selected.hasDraft && <p className={styles.activationNote}>A newer update is also awaiting review. Activation uses the current approved version only.</p>}
          </div>}
          {selected.hasDraft && <div className={styles.pendingDetail}><strong>Update waiting for approval</strong><p>A different authorized admin needs to review the submitted product details. No further action is required on this page until the review is complete.</p><Link href="/operations/taxonomy">Open approval queue</Link></div>}
          {!selected.hasDraft && !selected.retired && currentVersion(selected) != null && !editing && <div className={styles.publishedPanel}><div><h3>Product details · Version {currentVersion(selected)}</h3><p>{selected.publishedRuleset?.attributes?.length ?? 0} details in the approved version</p></div><button className={styles.simpleSecondary} type="button" onClick={()=>{setFields(savedSelection(selected));setStep("choose");setEditing(true);}}>Edit product details</button></div>}
          {!selected.hasDraft && !selected.retired && (editing || currentVersion(selected) == null) && (step==="choose" ? <>
            <div className={styles.editorIntro}><h3>{currentVersion(selected) == null ? "1. Choose product details" : "Update product details"}</h3><p>Select the information brands should enter for this category. Tick “Required” for essential details.</p></div>
            <div className={styles.simpleFieldList}>
              {attributes.map(attribute=>{const chosen=fields.find(field=>field.code===attribute.code);return <div className={styles.simpleField} key={attribute.code}>
                <label><input type="checkbox" checked={Boolean(chosen)} onChange={()=>toggleField(attribute.code)} disabled={!attribute.id}/><span>{attribute.label||attribute.code}</span></label>
                {chosen && <label className={styles.requiredToggle}><input type="checkbox" checked={chosen.required} onChange={e=>{const checked=e.currentTarget.checked;setFields(values=>values.map(field=>field.code===chosen.code?{...field,required:checked}:field));}}/>Required</label>}
              </div>})}
              {!attributes.length && <p>No product detail definitions were found.</p>}
            </div>
            <div className={styles.simpleActions}>
              {currentVersion(selected) != null && <button type="button" className={styles.simpleSecondary} onClick={()=>setEditing(false)}>Cancel changes</button>}
              <button className={styles.simplePrimary} disabled={!fields.length} type="button" onClick={prepare}>Review selected details <span aria-hidden="true">→</span></button>
            </div>
          </> : <>
            <div className={styles.editorIntro}><h3>2. Check and send for approval</h3><p>Review the details below. Another administrator will publish your changes.</p></div>
            <div className={styles.reviewSummary}><strong>{selected.name} · Version {version}</strong>
              {fields.map(field=><div key={field.code}>{attributes.find(a=>a.code===field.code)?.label||field.code}<span>{field.required?"Required":"Optional"}</span></div>)}
            </div>
            <div className={styles.simpleActions}><button type="button" className={styles.simpleSecondary} disabled={busy} onClick={()=>setStep("choose")}>Back</button><button className={styles.simplePrimary} type="button" disabled={busy} onClick={()=>void submit()}>{busy?"Submitting…":"Send for approval"}</button></div>
          </>)}
        </>}
      </section>
    </div>}
    <p className={styles.simpleFooter}>New categories become available to brands after a second admin approves their details and an admin activates the approved category.</p>
  </main>;
}
