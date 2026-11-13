"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AuthApiError, getCurrentSession } from "@/features/identity/auth-api";
import type { components, operations } from "@/generated/renivet-api";
import { canonicalVariantOptions, createIdempotencyKey, hasVariantCombination, type CategoryAttribute, W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import { ProductMediaWorkspace } from "@/features/seller/product-media-workspace";
import styles from "./product-workspace.module.css";

type ProductDetail = operations["getBrandProduct"]["responses"][200]["content"]["application/json"];
type SchemaVersion = components["schemas"]["CategorySchemaVersionReadDto"];
type MeasurementValue = { value: number; unitCode: string };
type AttributeValue = string | number | boolean | string[] | MeasurementValue | null;
type Claim = operations["listProductClaims"]["responses"][200]["content"]["application/json"]["items"][number];

function messageFor(error: unknown): string {
  if (error instanceof W2ApiError) return error.message;
  if (error instanceof AuthApiError && error.status === 401) return "Your session has expired. Sign in again, then reopen this workspace.";
  return "The product could not be loaded. Try again shortly.";
}

export function ProductDetailWorkspace({ brandId, productId }: { brandId: string; productId: string }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [schema, setSchema] = useState<SchemaVersion | null>(null);
  const [title, setTitle] = useState("");
  const [attributes, setAttributes] = useState<Record<string, AttributeValue>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [variantSku, setVariantSku] = useState("");
  const [variantOptions, setVariantOptions] = useState<Record<string, string>>({});
  const [editVariantOptions, setEditVariantOptions] = useState<Record<string, string>>({});
  const [variantError, setVariantError] = useState("");
  const [variantSaving, setVariantSaving] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [confirmingDeactivationId, setConfirmingDeactivationId] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimsError, setClaimsError] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [claimText, setClaimText] = useState("");
  const [claimEvidence, setClaimEvidence] = useState<string[]>([]);
  const [claimExpiry, setClaimExpiry] = useState("");
  const [claimNotice, setClaimNotice] = useState("");
  const [claimSaving, setClaimSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const idempotency = useRef<{ hash: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(""); setProduct(null); setSchema(null);
    w2Request<ProductDetail>(["brands", brandId, "products", productId], { signal: controller.signal }).then(async (value) => {
      setProduct(value);
      setTitle(value.title);
      setAttributes(Object.fromEntries(Object.entries(value.attributes).map(([key, entry]) => [key, normalizeAttributeValue(entry)])));
      const currentSchema = await w2Request<SchemaVersion>(["brands", brandId, "categories", value.categoryId, "schema-versions", String(value.categorySchemaVersion)], { signal: controller.signal });
      if (!controller.signal.aborted) setSchema(currentSchema);
      w2Request<{ items: Claim[] }>(["brands", brandId, "products", productId, "claims"], { signal: controller.signal }).then((history) => {
        if (!controller.signal.aborted) { setClaims(history.items); setClaimsError(""); }
      }).catch((error: unknown) => { if (!controller.signal.aborted) setClaimsError(messageFor(error)); });
    }).catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(messageFor(error)); }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [brandId, productId, reloadKey]);

  const productFields = useMemo(() => schema?.attributes.filter((attribute) => attribute.scope === "PRODUCT") ?? [], [schema]);
  const variantFields = useMemo(() => schema?.attributes.filter((attribute) => attribute.scope === "VARIANT") ?? [], [schema]);
  const editable = product?.publicationState === "DRAFT" || product?.publicationState === "INCOMPLETE";

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !editable) return;
    setSaveError(""); setSaveNotice("");
    const body: { title?: string; attributes?: Record<string, AttributeValue> } = {};
    if (title.trim() !== product.title) body.title = title.trim();
    if (JSON.stringify(attributes) !== JSON.stringify(Object.fromEntries(Object.entries(product.attributes).map(([key, entry]) => [key, normalizeAttributeValue(entry)])))) body.attributes = attributes;
    if (Object.keys(body).length === 0) { setSaveNotice("There are no changes to save."); return; }
    const hash = JSON.stringify(body);
    if (!idempotency.current || idempotency.current.hash !== hash) idempotency.current = { hash, key: createIdempotencyKey() };

    setSaving(true);
    try {
      const session = await getCurrentSession();
      const saved = await w2Request<ProductDetail>(["brands", brandId, "products", productId], {
        method: "PATCH", body, csrfToken: session.csrfToken, idempotencyKey: idempotency.current.key,
        ifMatch: `"${product.rowVersion}"`,
      });
      idempotency.current = null;
      setProduct(saved); setTitle(saved.title); setSaveNotice("Draft saved. You can continue later.");
    } catch (error) {
      if (error instanceof W2ApiError && error.status === 409) {
        setSaveError("This draft changed in another tab. Reload the latest version before saving again.");
      } else setSaveError(messageFor(error));
    } finally { setSaving(false); }
  }

  async function createVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !editable) return;
    const options = Object.fromEntries(Object.entries(variantOptions).filter(([, value]) => value.trim()).map(([code, value]) => [code, value.trim()]));
    setVariantError("");
    if (!/^[A-Za-z0-9_.-]{1,40}$/.test(variantSku.trim())) { setVariantError("Enter a SKU using letters, numbers, dots, dashes or underscores (up to 40 characters)."); return; }
    if (Object.keys(options).length === 0) { setVariantError("Choose at least one option value from this category’s variant fields."); return; }
    if (hasVariantCombination(options, product.variants)) { setVariantError("That size and color combination already exists. Change an option before adding this SKU."); return; }
    setVariantSaving(true);
    try {
      const session = await getCurrentSession();
      await w2Request(["brands", brandId, "products", productId, "variants"], {
        method: "POST", body: { sku: variantSku.trim(), options }, csrfToken: session.csrfToken,
        idempotencyKey: createIdempotencyKey(), ifMatch: `"${product.rowVersion}"`,
      });
      setVariantSku(""); setVariantOptions({}); setReloadKey((key) => key + 1);
    } catch (error) {
      setVariantError(error instanceof W2ApiError && error.status === 409 ? "This SKU or option combination conflicts with a newer catalogue change. Reload and review the variants." : messageFor(error));
    } finally { setVariantSaving(false); }
  }

  function startVariantEdit(variantId: string, options: Record<string, string>) {
    setEditingVariantId(variantId);
    setEditVariantOptions({ ...options });
    setConfirmingDeactivationId(null);
    setVariantError("");
  }

  async function saveVariant(variantId: string) {
    if (!product || !editable) return;
    const options = Object.fromEntries(Object.entries(editVariantOptions).filter(([, value]) => value.trim()).map(([code, value]) => [code, value.trim()]));
    setVariantError("");
    if (Object.keys(options).length === 0) { setVariantError("Keep at least one option value on this SKU."); return; }
    if (hasVariantCombination(options, product.variants, variantId)) { setVariantError("Another active SKU already uses that option combination."); return; }
    setVariantSaving(true);
    try {
      const session = await getCurrentSession();
      const variant = product.variants.find((item) => item.id === variantId);
      if (!variant) { setVariantError("This SKU is no longer in the product. Refresh the latest product data."); return; }
      await w2Request(["brands", brandId, "products", productId, "variants", variantId], {
        method: "PATCH", body: { options }, csrfToken: session.csrfToken,
        idempotencyKey: createIdempotencyKey(), ifMatch: `"${product.rowVersion}"`,
      });
      setEditingVariantId(null); setEditVariantOptions({}); setReloadKey((key) => key + 1);
    } catch (error) {
      setVariantError(error instanceof W2ApiError && error.status === 409
        ? "This SKU changed or now conflicts with another variant. Refresh and review the latest version."
        : messageFor(error));
    } finally { setVariantSaving(false); }
  }

  async function deactivateVariant(variantId: string) {
    if (!product || !editable) return;
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) { setVariantError("This SKU is no longer in the product. Refresh the latest product data."); return; }
    setVariantError("");
    setVariantSaving(true);
    try {
      const session = await getCurrentSession();
      await w2Request(["brands", brandId, "products", productId, "variants", variantId], {
        method: "DELETE", body: { reasonCode: "SELLER_DRAFT_REMOVAL" }, csrfToken: session.csrfToken,
        idempotencyKey: createIdempotencyKey(), ifMatch: `"${product.rowVersion}"`,
      });
      setEditingVariantId(null); setConfirmingDeactivationId(null); setReloadKey((key) => key + 1);
    } catch (error) {
      setConfirmingDeactivationId(null);
      setVariantError(error instanceof W2ApiError && error.status === 409
        ? "This SKU can’t be deactivated because its state changed or it has dependent records. Refresh and review it."
        : messageFor(error));
    } finally { setVariantSaving(false); }
  }

  async function proposeClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setClaimsError(""); setClaimNotice("");
    if (!product || product.publicationState !== "PUBLISHED") return;
    const eligibleEvidence = product.mediaLinks.filter((link) => link.scanState === "CLEAN" && link.rightsState === "ATTESTED").map((link) => link.mediaAssetId);
    const evidenceAssetIds = claimEvidence.filter((id) => eligibleEvidence.includes(id));
    if (!claimCode.trim() || !claimText.trim() || evidenceAssetIds.length === 0) { setClaimsError("Enter a claim and select at least one linked image with a clean scan and attested rights."); return; }
    setClaimSaving(true);
    try {
      const session = await getCurrentSession();
      const body = { claimCode: claimCode.trim(), claimText: claimText.trim(), evidenceAssetIds, ...(claimExpiry ? { expiresAt: new Date(`${claimExpiry}T23:59:59.000Z`).toISOString() } : {}) };
      await w2Request(["brands", brandId, "products", productId, "claims"], { method: "POST", body, csrfToken: session.csrfToken, idempotencyKey: createIdempotencyKey(), ifMatch: `"${product.rowVersion}"` });
      setClaimCode(""); setClaimText(""); setClaimEvidence([]); setClaimExpiry(""); setClaimNotice("Claim submitted for independent review. It is not verified or published automatically.");
      const history = await w2Request<{ items: Claim[] }>(["brands", brandId, "products", productId, "claims"]);
      setClaims(history.items);
    } catch (error) { setClaimsError(error instanceof W2ApiError && error.status === 409 ? "The product changed while you were preparing this claim. Reload and check the latest revision." : messageFor(error)); }
    finally { setClaimSaving(false); }
  }

  if (loading) return <main className={styles.page}><p className={styles.stateMessage} role="status">Loading product draft…</p></main>;
  if (loadError || !product) return <main className={styles.page} aria-labelledby="detail-title"><div className={styles.errorPanel} role="alert"><strong id="detail-title">Product unavailable</strong><p>{loadError || "This product is not available."}</p><button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button></div></main>;

  return <main className={styles.page} aria-labelledby="detail-title">
    <nav className={styles.detailBreadcrumb} aria-label="Breadcrumb"><Link href={`/brands/${encodeURIComponent(brandId)}/products`}>Products</Link><span aria-hidden="true">/</span><span>{product.title}</span></nav>
    <header className={styles.header}>
      <div><p className={styles.kicker}>STYLE {product.styleCode} <span aria-hidden="true">·</span> CONTENT VERSION {product.contentVersion}</p><h1 id="detail-title">{product.title}</h1><p className={styles.subtitle}>Your draft is saved privately to this brand. It is not submitted for review or visible to customers.</p></div>
      <span className={styles.state}>{product.publicationState.replaceAll("_", " ")}</span>
    </header>

    <section className={styles.formPanel} aria-labelledby="details-heading">
      <div className={styles.formHeading}><div><p className={styles.kicker}>PRODUCT DETAILS</p><h2 id="details-heading">Continue where you left off</h2><p>Update the parent product details. Variants, images, prices and claims stay in their own workflow steps.</p></div><span className={styles.draftBadge}>SCHEMA V{product.categorySchemaVersion}</span></div>
      {!editable && <div className={styles.readOnlyNotice} role="status">This product is {product.publicationState.toLowerCase().replaceAll("_", " ")} and is read-only in this draft editor. No lifecycle action is available here.</div>}
      <form onSubmit={saveDraft}>
        <div className={styles.formGrid}>
          <div className={styles.fieldWide}><label htmlFor="detail-title-input">Product name</label><input id="detail-title-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} disabled={!editable} /><small>Row version {product.rowVersion} protects edits from overwriting newer work.</small></div>
          {productFields.map((field) => <AttributeEditor key={`${field.scope}-${field.code}`} field={field} value={attributes[field.code]} disabled={!editable} onChange={(value) => setAttributes((current) => ({ ...current, [field.code]: value }))} />)}
        </div>
        {schema && <div className={styles.schemaPanel}><div><p className={styles.kicker}>PINNED CATEGORY SCHEMA</p><h3>{schema.state === "PUBLISHED" ? "Published schema" : "Draft schema"} · version {schema.version}</h3><p>Attributes are shown from the exact version pinned to this product draft.</p></div><p className={styles.schemaLoading}>{productFields.length} product field{productFields.length === 1 ? "" : "s"} · {schema.validatorVersion}</p></div>}
        {saveError && <div className={styles.error} role="alert">{saveError}{saveError.includes("another tab") && <button type="button" className={styles.textButton} onClick={() => setReloadKey((key) => key + 1)}>Reload latest draft</button>}</div>}
        {saveNotice && <p className={styles.notice} role="status">{saveNotice}</p>}
        <div className={styles.formActions}><p>Saving updates this draft only.</p>{editable && <button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>}</div>
      </form>
    </section>
    <section className={styles.formPanel} aria-labelledby="variants-heading">
      <div className={styles.formHeading}><div><p className={styles.kicker}>SKU MATRIX</p><h2 id="variants-heading">Sizes and colors</h2><p>Each SKU is unique to this product. The backend checks the pinned category schema and catches concurrent conflicts.</p></div><span className={styles.draftBadge}>{product.variants.length} SKU{product.variants.length === 1 ? "" : "s"}</span></div>
      {product.variants.length > 0 && <div className={styles.tableWrap}><table className={styles.variantTable}><caption className={styles.visuallyHidden}>Product SKU variants</caption><thead><tr><th scope="col">SKU</th><th scope="col">Options</th><th scope="col">State</th><th scope="col">Image scan</th>{editable && <th scope="col">Draft actions</th>}</tr></thead><tbody>{product.variants.map((variant) => <tr key={variant.id}><th scope="row">{variant.sku}</th><td>{Object.entries(variant.options).map(([key, value]) => `${key}: ${value}`).join(" · ") || "No options"}</td><td>{variant.variantState.replaceAll("_", " ")}</td><td>{variant.mediaLinks?.map((media) => media.scanState).join(", ") || "No variant image"}</td>{editable && <td>{variant.variantState === "INACTIVE" ? <span>Retired</span> : <div className={styles.mediaActions}><button type="button" className={styles.textButton} disabled={variantSaving} onClick={() => editingVariantId === variant.id ? setEditingVariantId(null) : startVariantEdit(variant.id, variant.options)}>{editingVariantId === variant.id ? "Cancel edit" : "Edit SKU options"}</button>{confirmingDeactivationId === variant.id ? <><button type="button" className={styles.textButton} disabled={variantSaving} onClick={() => void deactivateVariant(variant.id)}>Confirm deactivation</button><button type="button" className={styles.textButton} disabled={variantSaving} onClick={() => setConfirmingDeactivationId(null)}>Keep SKU</button></> : <button type="button" className={styles.textButton} disabled={variantSaving} onClick={() => { setVariantError(""); setConfirmingDeactivationId(variant.id); }}>Deactivate SKU</button>}</div>}</td>}</tr>)}</tbody></table></div>}
      {editingVariantId && editable && <div className={styles.schemaPanel} aria-labelledby="edit-variant-heading"><div><p className={styles.kicker}>EDIT SKU OPTIONS</p><h3 id="edit-variant-heading">Update the variant</h3><p>The SKU itself is permanent. Changes use this SKU’s current version and can be rejected if another SKU or a dependent record conflicts.</p></div><div className={styles.formGrid}>{variantFields.filter((field) => field.type === "enum" || field.type === "text").map((field) => <div className={styles.field} key={field.code}><label htmlFor={`edit-variant-${field.code}`}>{field.code.replaceAll("_", " ")}{field.required && " *"}</label>{field.type === "enum" ? <select id={`edit-variant-${field.code}`} value={editVariantOptions[field.code] ?? ""} onChange={(event) => setEditVariantOptions((current) => ({ ...current, [field.code]: event.target.value }))}><option value="">Choose an option</option>{(field.allowedValues ?? []).map((value) => <option key={value} value={value}>{value}</option>)}</select> : <input id={`edit-variant-${field.code}`} value={editVariantOptions[field.code] ?? ""} onChange={(event) => setEditVariantOptions((current) => ({ ...current, [field.code]: event.target.value }))} maxLength={128} />}</div>)}</div><div className={styles.formActions}><p>Changes are saved only to this draft.</p><button type="button" className={styles.primaryButton} disabled={variantSaving} onClick={() => void saveVariant(editingVariantId)}>{variantSaving ? "Saving SKU…" : "Save SKU changes"}</button></div></div>}
      {variantError && <p className={styles.error} role="alert">{variantError}</p>}
      {editable ? <form onSubmit={createVariant} noValidate><div className={styles.formGrid}>
        <div className={styles.field}><label htmlFor="variant-sku">SKU <span aria-hidden="true">*</span></label><input id="variant-sku" value={variantSku} onChange={(event) => setVariantSku(event.target.value)} maxLength={40} autoComplete="off" /></div>
        {variantFields.filter((field) => field.type === "enum" || field.type === "text").map((field) => <div className={styles.field} key={field.code}><label htmlFor={`variant-${field.code}`}>{field.code.replaceAll("_", " ")}{field.required && " *"}</label>{field.type === "enum" ? <select id={`variant-${field.code}`} value={variantOptions[field.code] ?? ""} onChange={(event) => setVariantOptions((current) => ({ ...current, [field.code]: event.target.value }))}><option value="">Choose an option</option>{(field.allowedValues ?? []).map((value) => <option key={value} value={value}>{value}</option>)}</select> : <input id={`variant-${field.code}`} value={variantOptions[field.code] ?? ""} onChange={(event) => setVariantOptions((current) => ({ ...current, [field.code]: event.target.value }))} maxLength={128} />}</div>)}
      </div>{variantFields.some((field) => field.type !== "enum" && field.type !== "text") && <p className={styles.inlineError}>Some pinned variant fields use types the current variant API cannot safely submit. Those fields are left out; the server will reject incomplete variants.</p>}
      <div className={styles.formActions}><p>Combination: {canonicalVariantOptions(variantOptions)}</p><button className={styles.primaryButton} type="submit" disabled={variantSaving || variantFields.length === 0}>{variantSaving ? "Adding SKU…" : "Add SKU"}</button></div></form> : <p className={styles.readOnlyNotice} role="status">Variants are read-only after the draft enters review or publication.</p>}
    </section>
    <ProductMediaWorkspace brandId={brandId} productId={productId} product={product} editable={editable} onChanged={() => setReloadKey((key) => key + 1)} />
    <section className={styles.formPanel} aria-labelledby="prices-heading">
      <div className={styles.formHeading}><div><p className={styles.kicker}>PRICE HISTORY</p><h2 id="prices-heading">Price proposals</h2><p>Only backend price states are shown. A pending proposal is not an approved selling price.</p></div></div>
      {product.variants.some((variant) => (variant.priceVersions?.length ?? 0) > 0) ? product.variants.map((variant) => {
        if (!variant.priceVersions?.length) return null;
        return <div className={styles.tableWrap} key={variant.id}><table className={styles.variantTable}><caption>Price history · {variant.sku}</caption><thead><tr><th scope="col">Selling price</th><th scope="col">MRP</th><th scope="col">Valid from</th><th scope="col">Valid to</th><th scope="col">State</th></tr></thead><tbody>{variant.priceVersions.map((price) => <tr key={price.id}><td>₹{(price.amountMinor / 100).toFixed(2)}</td><td>₹{(price.mrpMinor / 100).toFixed(2)}</td><td>{new Date(price.validFrom).toLocaleDateString()}</td><td>{price.validTo ? new Date(price.validTo).toLocaleDateString() : "Open-ended"}</td><td>{price.priceState === "PENDING" ? "Pending review" : price.priceState.replaceAll("_", " ")}</td></tr>)}</tbody></table></div>;
      }) : <p className={styles.emptyLine}>No price proposals have been recorded for these SKUs.</p>}
      <p className={styles.inlineError}>New price proposals need a server-issued rule version. The current registered API has no read operation for that rule, so this screen does not guess one.</p>
    </section>
    <section className={styles.formPanel} aria-labelledby="claims-heading">
      <div className={styles.formHeading}><div><p className={styles.kicker}>SUSTAINABILITY EVIDENCE</p><h2 id="claims-heading">Claims and verification</h2><p>Claims remain pending until an independent reviewer checks current evidence and expiry. The brand cannot self-verify.</p></div><span className={styles.draftBadge}>{claims.length} claim{claims.length === 1 ? "" : "s"}</span></div>
      {claimsError && <p className={styles.error} role="alert">{claimsError}</p>}
      {claims.length > 0 && <div className={styles.tableWrap}><table className={styles.variantTable}><caption className={styles.visuallyHidden}>Sustainability claim history</caption><thead><tr><th scope="col">Claim</th><th scope="col">State</th><th scope="col">Expires</th><th scope="col">Evidence count</th></tr></thead><tbody>{claims.map((claim) => <tr key={claim.id}><th scope="row">{claim.claimCode}</th><td>{claim.claimState === "PENDING" ? "Pending independent review" : claim.claimState}</td><td>{claim.expiresAt ? new Date(claim.expiresAt).toLocaleDateString() : "No expiry recorded"}</td><td>{claim.evidenceAssetIds.length}</td></tr>)}</tbody></table></div>}
      {product.publicationState === "PUBLISHED" ? <form onSubmit={proposeClaim} noValidate><div className={styles.formGrid}>
        <div className={styles.field}><label htmlFor="claim-code">Claim type</label><input id="claim-code" value={claimCode} onChange={(event) => setClaimCode(event.target.value)} maxLength={128} /></div>
        <div className={styles.field}><label htmlFor="claim-expiry">Evidence expiry (optional)</label><input id="claim-expiry" type="date" value={claimExpiry} onChange={(event) => setClaimExpiry(event.target.value)} /></div>
        <div className={styles.fieldWide}><label htmlFor="claim-text">Claim wording</label><textarea id="claim-text" rows={3} maxLength={2000} value={claimText} onChange={(event) => setClaimText(event.target.value)} /></div>
        <fieldset className={styles.fieldWide}><legend>Supporting images that passed scan and rights checks</legend>{product.mediaLinks.filter((link) => link.scanState === "CLEAN" && link.rightsState === "ATTESTED").map((link) => <label className={styles.checkboxLabel} key={link.mediaAssetId}><input type="checkbox" checked={claimEvidence.includes(link.mediaAssetId)} onChange={(event) => setClaimEvidence((current) => event.target.checked ? [...new Set([...current, link.mediaAssetId])] : current.filter((id) => id !== link.mediaAssetId))} /> Evidence asset {link.mediaAssetId}</label>)}{product.mediaLinks.every((link) => link.scanState !== "CLEAN" || link.rightsState !== "ATTESTED") && <p>No eligible linked evidence is available yet.</p>}</fieldset>
      </div>{claimNotice && <p className={styles.notice} role="status">{claimNotice}</p>}<div className={styles.formActions}><p>Verification is performed by a separate reviewer.</p><button className={styles.primaryButton} type="submit" disabled={claimSaving}>{claimSaving ? "Submitting…" : "Submit claim for review"}</button></div></form> : <p className={styles.readOnlyNotice} role="status">A claim can be proposed only against a published product revision.</p>}
    </section>
  </main>;
}

function normalizeAttributeValue(value: unknown): AttributeValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const measurement = value as Record<string, unknown>;
    if (typeof measurement.value === "number" && Number.isFinite(measurement.value) && typeof measurement.unitCode === "string") {
      return { value: measurement.value, unitCode: measurement.unitCode };
    }
  }
  return null;
}

function AttributeEditor({ field, value, disabled, onChange }: {
  field: CategoryAttribute;
  value: AttributeValue;
  disabled: boolean;
  onChange: (value: AttributeValue) => void;
}) {
  const id = `attribute-${field.code}`;
  const descriptionId = `${id}-description`;
  const label = <label htmlFor={id}>{field.code.replaceAll("_", " ")}{field.required && <> <span aria-hidden="true">*</span><span className={styles.visuallyHidden}> required</span></>}</label>;
  const description = <small id={descriptionId}>{field.required ? "Required before product review." : "Optional category-specific detail."}</small>;
  if (field.type === "enum") return <div className={styles.field}><>{label}</><select id={id} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value || null)} disabled={disabled} aria-describedby={descriptionId}><option value="">Choose an option</option>{(field.allowedValues ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select>{description}</div>;
  if (field.type === "boolean") return <div className={styles.field}><>{label}</><select id={id} value={typeof value === "boolean" ? String(value) : ""} onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "true")} disabled={disabled} aria-describedby={descriptionId}><option value="">Choose yes or no</option><option value="true">Yes</option><option value="false">No</option></select>{description}</div>;
  if (field.type === "multi_enum") return <div className={styles.fieldWide}><>{label}</><select id={id} multiple value={Array.isArray(value) ? value : []} onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => option.value))} disabled={disabled} aria-describedby={descriptionId}>{(field.allowedValues ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select>{description}</div>;
  if (field.type === "measurement") {
    const measurement = value && typeof value === "object" && !Array.isArray(value) ? value as MeasurementValue : null;
    return <div className={styles.field}><>{label}</><input id={id} value={measurement ? `${measurement.value} ${measurement.unitCode}` : "Not set"} disabled readOnly aria-describedby={descriptionId} /><small id={descriptionId}>The current API schema omits the measurement unit rule. This value is preserved as-is until that contract is available.</small></div>;
  }
  const inputType = field.type === "integer" || field.type === "decimal" ? "number" : field.type === "date" ? "date" : "text";
  const step = field.type === "integer" ? "1" : field.type === "decimal" ? "any" : undefined;
  return <div className={styles.field}><>{label}</><input id={id} type={inputType} step={step} value={typeof value === "string" || typeof value === "number" ? value : ""} onChange={(event) => onChange(event.target.value === "" ? null : inputType === "number" ? Number(event.target.value) : event.target.value)} disabled={disabled} aria-describedby={descriptionId} />{description}</div>;
}
