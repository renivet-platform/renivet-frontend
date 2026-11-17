"use client";

import { useEffect, useMemo, useState } from "react";
import { getCurrentSession, stepUpWithMfa } from "@/features/identity/auth-api";
import { shouldRequestMfaStepUp, type MfaEnforcementMode } from "@/features/identity/mfa-policy";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./taxonomy-admin.module.css";

type Category = { id: string; code: string; name: string; active?: boolean; isActive?: boolean; schemaVersion?: number; currentSchemaVersion?: number; isLeaf: boolean; hasDraft?: boolean };
type Attribute = { id?: string; code: string; label?: string; valueType?: string; type?: string; scopeType?: string; scope?: string };
type Draft = { categoryId: string; version: number; validatorVersion: string; selected: string[]; rulesetText: string };
const key = "renivet.taxonomy.draft.v1";
const defaultDraft: Draft = { categoryId: "", version: 1, validatorVersion: "w2-attribute-validator-v1", selected: [], rulesetText: "" };

function message(error: unknown) {
  if (error instanceof W2ApiError) {
    if (error.status === 403) return "You need the global taxonomy.manage permission; MFA follows the server’s current environment policy.";
    if (error.status === 409) return "The taxonomy changed or the category is already active. Reload before submitting.";
    if (error.status === 401) return "Your session expired. Sign in again.";
    return error.message;
  }
  return error instanceof Error ? error.message : "The taxonomy service is unavailable.";
}

export function TaxonomyAdminWorkspace() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [mfa, setMfa] = useState("");
  const [mfaEnforcementMode, setMfaEnforcementMode] = useState<MfaEnforcementMode>("enforced");
  const [mfaModeLoaded, setMfaModeLoaded] = useState(false);
  const [reasonCode, setReasonCode] = useState("PILOT_APPROVED");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const selected = useMemo(() => categories.find((category) => category.id === draft.categoryId), [categories, draft.categoryId]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) setDraft({ ...defaultDraft, ...JSON.parse(saved) });
    } catch { setStatus("No resumable taxonomy draft was found."); }
    void load();
    void getCurrentSession().then((session) => {
      setMfaEnforcementMode(session.mfaEnforcementMode);
      setMfaModeLoaded(true);
    }).catch(() => {
      setMfaEnforcementMode("enforced");
      setMfaModeLoaded(true);
    });
  }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const [categoryResult, attributeResult] = await Promise.all([
        w2Request<{ items: Category[] }>(["admin", "catalog", "categories"]),
        w2Request<{ items: Attribute[] }>(["admin", "catalog", "categories", "attributes"]),
      ]);
      setCategories(categoryResult.items ?? []);
      setAttributes(attributeResult.items ?? []);
    } catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }

  function choose(id: string) {
    const category = categories.find((value) => value.id === id);
    setPreview(null);
    setDraft((current) => ({ ...current, categoryId: id, version: Math.max(1, (category?.currentSchemaVersion ?? category?.schemaVersion ?? 0) + 1) }));
  }

  function save() {
    sessionStorage.setItem(key, JSON.stringify(draft));
    setStatus("Draft saved locally. It can be resumed in this browser.");
  }

  function buildPreview() {
    if (!selected || !selected.isLeaf) { setError("Choose a leaf category. Parent categories cannot receive schemas."); return; }
    try {
      const rules = draft.rulesetText.trim() ? JSON.parse(draft.rulesetText) : {
        attributes: draft.selected.map((code) => {
          const attribute = attributes.find((item) => item.code === code);
          return { attributeId: attribute?.id, code, scope: attribute?.scopeType ?? attribute?.scope ?? "product", valueType: attribute?.valueType ?? attribute?.type ?? "text", requiredByDefault: false };
        }),
      };
      if (!rules || typeof rules !== "object" || !Array.isArray((rules as { attributes?: unknown }).attributes)
        || ((rules as { attributes: unknown[] }).attributes).some((item) => !item || typeof item !== "object" || typeof (item as { attributeId?: unknown }).attributeId !== "string")) {
        throw new Error("Select attributes with persisted identifiers or provide valid ruleset JSON.");
      }
      setPreview({ categoryId: draft.categoryId, version: draft.version, validatorVersion: draft.validatorVersion, ruleset: rules });
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ruleset must be valid JSON."); }
  }

  async function submit() {
    if (!preview) { setError("Build and review the immutable preview first."); return; }
    setBusy(true); setError("");
    try {
      const session = await getCurrentSession();
      setMfaEnforcementMode(session.mfaEnforcementMode);
      setMfaModeLoaded(true);
      let csrfToken = session.csrfToken;
      if (shouldRequestMfaStepUp(session.mfaEnforcementMode)) {
        if (!/^\d{6}$/.test(mfa.trim())) throw new Error("Enter the six-digit MFA code.");
        const elevated = await stepUpWithMfa(mfa.trim(), session.csrfToken);
        csrfToken = elevated.csrfToken;
        setMfa("");
      }
      await w2Request(["admin", "catalog", "categories", draft.categoryId, "schema-versions"], {
        method: "POST",
        body: { categoryId: draft.categoryId, version: draft.version, ruleset: preview.ruleset, validatorVersion: draft.validatorVersion },
        csrfToken,
        idempotencyKey: crypto.randomUUID(),
      });
      setStatus("Taxonomy proposal submitted and persisted. Independent publication remains a separate review decision.");
      setPreview(null);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function activate() {
    if (!selected || (selected.active !== false && selected.isActive !== false)) { setError("Select an inactive category to activate."); return; }
    if (!selected.schemaVersion && !selected.currentSchemaVersion) { setError("Publish a schema version with an independent reviewer before activation."); return; }
    if (!/^[A-Z][A-Z0-9_]{0,63}$/.test(reasonCode)) { setError("Use an uppercase audit reason such as PILOT_APPROVED."); return; }
    setBusy(true); setError("");
    try {
      const session = await getCurrentSession();
      setMfaEnforcementMode(session.mfaEnforcementMode);
      setMfaModeLoaded(true);
      let csrfToken = session.csrfToken;
      if (shouldRequestMfaStepUp(session.mfaEnforcementMode)) {
        if (!/^\d{6}$/.test(mfa.trim())) throw new Error("Enter the six-digit MFA code.");
        const elevated = await stepUpWithMfa(mfa.trim(), session.csrfToken);
        csrfToken = elevated.csrfToken;
        setMfa("");
      }
      await w2Request(["admin", "catalog", "categories", selected.id, "activate"], {
        method: "POST", body: { reasonCode }, csrfToken, idempotencyKey: crypto.randomUUID(),
      });
      setStatus("Category activated and the immutable availability audit event was persisted.");
      await load();
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  return <main className={styles.shell}>
    <header className={styles.top}><div><p className={styles.eyebrow}>RENIVET · TAXONOMY ADMINISTRATION</p><h1>Category and schema proposals</h1><p className={styles.muted}>Create a versioned proposal; publication and activation remain maker-checker gated.</p></div><a href="/operations">Back to operations</a></header>
    {status && <p className={styles.notice} role="status">{status}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.layout}>
      <section className={styles.panel}><h2>Categories</h2><p className={styles.muted}>Only persisted categories from the backend are shown.</p>
        {loading ? <p>Loading…</p> : <div className={styles.list}>{categories.map((category) => <button className={styles.item} aria-current={category.id === draft.categoryId} key={category.id} onClick={() => choose(category.id)}><strong>{category.name} · {category.code}</strong><span>{category.isLeaf ? "Leaf" : "Parent"} · {category.active === false || category.isActive === false ? "inactive" : "active"} · schema {category.currentSchemaVersion ?? category.schemaVersion ?? "—"}</span></button>)}</div>}
      </section>
      <section className={styles.panel}><h2>Proposal editor</h2>{selected ? <p className={styles.muted}>Selected: {selected.name} ({selected.code})</p> : <p className={styles.muted}>Select a category to begin.</p>}
        <div className={styles.form}>
          <label>Proposal version<input type="number" min={1} value={draft.version} onChange={(event) => setDraft({ ...draft, version: Number(event.target.value) })} /></label>
          <label>Validator version<input value={draft.validatorVersion} onChange={(event) => setDraft({ ...draft, validatorVersion: event.target.value })} /></label>
          <fieldset><legend>Attributes</legend><div className={styles.checks}>{attributes.map((attribute) => <label key={attribute.code}><input type="checkbox" checked={draft.selected.includes(attribute.code)} onChange={(event) => setDraft({ ...draft, selected: event.target.checked ? [...draft.selected, attribute.code] : draft.selected.filter((value) => value !== attribute.code) })} />{attribute.label ?? attribute.code} <small>({attribute.valueType ?? attribute.type ?? "unknown"})</small></label>)}</div></fieldset>
          <label>Advanced ruleset JSON (optional)<textarea value={draft.rulesetText} onChange={(event) => setDraft({ ...draft, rulesetText: event.target.value })} placeholder='{"attributes":[]}' /></label>
          <div className={styles.actions}><button className={`${styles.button} ${styles.secondary}`} onClick={save}>Save draft</button><button className={styles.button} onClick={buildPreview}>Build immutable preview</button><button className={`${styles.button} ${styles.secondary}`} onClick={() => void load()}>Reload</button></div>
          {preview && <><h3>Immutable preview</h3><pre className={styles.preview}>{JSON.stringify(preview, null, 2)}</pre>{mfaModeLoaded && shouldRequestMfaStepUp(mfaEnforcementMode) ? <label>MFA step-up code<input value={mfa} onChange={(event) => setMfa(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label> : null}<button className={styles.button} disabled={busy} onClick={() => void submit()}>{busy ? "Submitting…" : "Submit proposal"}</button></>}
          {selected && selected.isLeaf && selected.active === false && (selected.schemaVersion || selected.currentSchemaVersion) ? <><h3>Activate published category</h3><p className={styles.muted}>Activation is allowed only after an independent schema publication.</p><label>Audit reason<input value={reasonCode} onChange={(event) => setReasonCode(event.target.value.toUpperCase())} /></label>{mfaModeLoaded && shouldRequestMfaStepUp(mfaEnforcementMode) ? <label>MFA step-up code<input value={mfa} onChange={(event) => setMfa(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label> : null}<button className={styles.button} disabled={busy} onClick={() => void activate()}>{busy ? "Activating…" : "Activate category"}</button></> : null}
        </div>
      </section>
    </div>
  </main>;
}
