"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AuthApiError, getCurrentSession } from "@/features/identity/auth-api";
import type { components, operations } from "@/generated/renivet-api";
import { canonicalVariantOptions, createIdempotencyKey, createSubmissionRequestDigest, hasVariantCombination, type CategoryAttribute, W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import { ProductMediaWorkspace } from "@/features/seller/product-media-workspace";
import { ProductVariantMatrix } from "@/features/seller/product-variant-matrix";
import styles from "./product-workspace.module.css";
import prototypeStyles from "./product-editor-prototype.module.css";

type ProductDetail = operations["getBrandProduct"]["responses"][200]["content"]["application/json"];
type SchemaVersion = components["schemas"]["CategorySchemaVersionReadDto"];
type MeasurementValue = { value: number; unitCode: string };
type AttributeValue = string | number | boolean | string[] | MeasurementValue | null;
type Claim = operations["listProductClaims"]["responses"][200]["content"]["application/json"]["items"][number];
type PriceProposalReceipt = operations["proposeVariantPrice"]["responses"][202]["content"]["application/json"];

function inrToMinor(value: string): number {
  if (!/^\\d{1,9}(?:\\.\\d{1,2})?$/.test(value.trim())) return NaN;
  const [rupees, paise = ""] = value.trim().split(".");
  return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
}

function messageFor(error: unknown): string {
  if (error instanceof W2ApiError) return error.message;
  if (error instanceof AuthApiError && error.status === 401) return "Your session has expired. Sign in again, then reopen this workspace.";
  return "The product could not be loaded. Try again shortly.";
}

export function ProductDetailWorkspace({ brandId, productId }: { brandId: string; productId: string }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [schema, setSchema] = useState<SchemaVersion | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeStep, setActiveStep] = useState(0);
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
  const [priceVariantId, setPriceVariantId] = useState<string | null>(null);
  const [sellingPriceMinor, setSellingPriceMinor] = useState("");
  const [mrpMinor, setMrpMinor] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [ruleVersion, setRuleVersion] = useState("");
  const [priceReason, setPriceReason] = useState("");
  const [priceError, setPriceError] = useState("");
  const [priceNotice, setPriceNotice] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimsError, setClaimsError] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [claimText, setClaimText] = useState("");
  const [claimEvidence, setClaimEvidence] = useState<string[]>([]);
  const [claimExpiry, setClaimExpiry] = useState("");
  const [claimNotice, setClaimNotice] = useState("");
  const [claimSaving, setClaimSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionNotice, setSubmissionNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const idempotency = useRef<{ hash: string; key: string } | null>(null);
  const submissionIdempotency = useRef<{ versions: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(""); setProduct(null); setSchema(null);
    w2Request<ProductDetail>(["brands", brandId, "products", productId], { signal: controller.signal }).then(async (value) => {
      setProduct(value);
      setTitle(value.title);
      setDescription((value as ProductDetail & { description?: string }).description ?? "");
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
  const detailsDirty = Boolean(product) && (title.trim() !== product?.title ||
    description !== ((product as ProductDetail & { description?: string })?.description ?? "") ||
    JSON.stringify(attributes) !== JSON.stringify(Object.fromEntries(Object.entries(product?.attributes ?? {}).map(([key, value]) => [key, normalizeAttributeValue(value)]))));
  function goToStep(step: number) {
    if (step === activeStep) return;
    if (activeStep === 0 && detailsDirty && editable) {
      setSaveError("Save your details before leaving this step, so nothing is lost.");
      return;
    }
    setActiveStep(Math.max(0, Math.min(5, step)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const readinessChecks = useMemo(() => {
    if (!product) return [];
    const requiredAttributesComplete = productFields.filter((field) => field.required).every((field) => {
      const value = attributes[field.code];
      return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
    });
    const activeVariants = product.variants.filter((variant) => variant.variantState !== "INACTIVE");
    const allMedia = [...product.mediaLinks, ...product.variants.flatMap((variant) => variant.mediaLinks ?? [])] as Array<ProductDetail["mediaLinks"][number] & { altText?: string }>;
    const eligible = (link: ProductDetail["mediaLinks"][number]) => link.scanState === "CLEAN" && link.rightsState === "ATTESTED";
    const colours = Array.from(new Set(activeVariants.map((variant) => variant.options.color ?? variant.options.colour).filter(Boolean)));
    const coloursWithPhotos = colours.every((colour) => activeVariants
      .filter((variant) => (variant.options.color ?? variant.options.colour) === colour)
      .some((variant) => variant.mediaLinks?.some(eligible)));
    const photoReady = activeVariants.length > 0 && (colours.length <= 1
      ? allMedia.some(eligible)
      : coloursWithPhotos);
    const described = allMedia.length > 0 && allMedia.every((link) => Boolean(link.altText?.trim()));
    const priced = activeVariants.length > 0 && activeVariants.every((variant) => variant.priceVersions?.some((price) => price.priceState === "APPROVED"));
    const claimEvidenceComplete = claims.length === 0 || claims.every((claim) => claim.evidenceAssetIds.length > 0);
    return [
      { label: "Required details filled", detail: "Save the product name and required fields from this category.", ready: title.trim().length > 0 && Boolean(schema) && requiredAttributesComplete && !detailsDirty, step: 0 },
      { label: "At least one size and colour", detail: activeVariants.length ? String(activeVariants.length) + " active SKU(s)" : "Add sizes and colours to create SKUs.", ready: activeVariants.length > 0, step: 1 },
      { label: "Every colour has a photo", detail: "Add a clear product photo for each offered colour.", ready: photoReady, step: 2 },
      { label: "Every photo has a description", detail: "Descriptions help shoppers who use screen readers.", ready: described, step: 2 },
      { label: "Prices approved for every SKU", detail: "Propose a price for each active SKU. Renivet must approve it before submission.", ready: priced, step: 3 },
      { label: "Claims have evidence", detail: claims.length ? "Each submitted claim needs supporting evidence." : "No claims yet — they are optional.", ready: claimEvidenceComplete, step: 4 },
    ];
  }, [attributes, claims, detailsDirty, product, productFields, schema, title]);

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !editable) return;
    setSaveError(""); setSaveNotice("");
    const body: { title?: string; description?: string; attributes?: Record<string, AttributeValue> } = {};
    if (title.trim() !== product.title) body.title = title.trim();
    if (description !== ((product as ProductDetail & { description?: string }).description ?? "")) body.description = description;
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
      setProduct(saved); setTitle(saved.title); setDescription((saved as ProductDetail & { description?: string }).description ?? description); setSaveNotice("Details saved to the draft.");
    } catch (error) {
      if (error instanceof W2ApiError && error.status === 409) {
        setSaveError("This draft changed in another tab. Reload the latest version before saving again.");
      } else setSaveError(messageFor(error));
    } finally { setSaving(false); }
  }

  async function submitForReview() {
    if (!product || !editable || submitting) return;
    setSubmissionError(""); setSubmissionNotice(""); setSubmitting(true);
    const versions = `${product.rowVersion}:${product.contentVersion}:${product.categorySchemaVersion}`;
    if (!submissionIdempotency.current || submissionIdempotency.current.versions !== versions) {
      submissionIdempotency.current = { versions, key: createIdempotencyKey() };
    }
    try {
      const session = await getCurrentSession();
      const contentSha256 = await createSubmissionRequestDigest({
        productId: product.id,
        rowVersion: product.rowVersion,
        draftContentVersion: product.contentVersion,
        categorySchemaVersion: product.categorySchemaVersion,
      });
      await w2Request(["brands", brandId, "products", productId, "submit"], {
        method: "POST",
        body: { draftContentVersion: product.contentVersion, categorySchemaVersion: product.categorySchemaVersion, contentSha256 },
        csrfToken: session.csrfToken,
        idempotencyKey: submissionIdempotency.current.key,
        ifMatch: `"${product.rowVersion}"`,
      });
      submissionIdempotency.current = null;
      setSubmissionNotice("Submitted for independent review. This exact revision is now frozen while it is reviewed.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setSubmissionError(messageFor(error));
    } finally { setSubmitting(false); }
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

  async function proposePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !editable || !priceVariantId) return;
    setPriceError(""); setPriceNotice("");
    const selling = inrToMinor(sellingPriceMinor);
    const mrp = inrToMinor(mrpMinor);
    const rule = Number(ruleVersion);
    if (!Number.isSafeInteger(selling) || selling < 1) { setPriceError("Enter a positive selling price in rupees (up to two decimal places)."); return; }
    if (!Number.isSafeInteger(mrp) || mrp < selling) { setPriceError("MRP must be at least the selling price, in rupees."); return; }
    if (!Number.isSafeInteger(rule) || rule < 1) { setPriceError("Enter the server-issued INR pricing rule version."); return; }
    if (!validFrom) { setPriceError("Choose when this price becomes valid."); return; }
    const from = new Date(validFrom);
    const to = validTo ? new Date(validTo) : null;
    if (Number.isNaN(from.valueOf()) || (to && Number.isNaN(to.valueOf())) || (to && to <= from)) { setPriceError("The price validity window is invalid."); return; }
    setPriceSaving(true);
    try {
      const session = await getCurrentSession();
      const receipt = await w2Request<PriceProposalReceipt>(["brands", brandId, "variants", priceVariantId, "prices"], {
        method: "PATCH",
        body: {
          currency: "INR",
          sellingPriceMinor: selling,
          mrpMinor: mrp,
          validFrom: from.toISOString(),
          ...(to ? { validTo: to.toISOString() } : {}),
          ruleVersion: rule,
          ...(priceReason.trim() ? { reasonCode: priceReason.trim() } : {}),
        },
        csrfToken: session.csrfToken,
        idempotencyKey: createIdempotencyKey(),
        ifMatch: `"${product.rowVersion}"`,
      });
      setPriceNotice(`Price proposal ${receipt.id} is pending independent review.`);
      setPriceVariantId(null); setSellingPriceMinor(""); setMrpMinor(""); setValidFrom(""); setValidTo(""); setRuleVersion(""); setPriceReason("");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setPriceError(error instanceof W2ApiError && (error.status === 409 || error.status === 412)
        ? "This price changed while you were preparing it. Reload the product and try again."
        : messageFor(error));
    } finally { setPriceSaving(false); }
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

  if (loading) return <main className={styles.page} data-screen-id="SE-09"><p className={styles.stateMessage} role="status">Loading product draft…</p></main>;
  if (loadError || !product) return <main className={styles.page} aria-labelledby="detail-title" data-screen-id="SE-09"><div className={styles.errorPanel} role="alert"><strong id="detail-title">Product unavailable</strong><p>{loadError || "This product is not available."}</p><button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button></div></main>;

  return <main className={styles.page} aria-labelledby="detail-title" data-screen-id="SE-09">
    <nav className={styles.detailBreadcrumb} aria-label="Breadcrumb"><Link href={`/brands/${encodeURIComponent(brandId)}/products`}>Products</Link><span aria-hidden="true">/</span><span>{product.title}</span></nav>
    <header className={styles.header}>
      <div><p className={styles.kicker}>STYLE {product.styleCode} <span aria-hidden="true">·</span> CONTENT VERSION {product.contentVersion}</p><h1 id="detail-title">{product.title}</h1><p className={styles.subtitle}>{editable ? "Changes to this draft are private until an independent review and publish decision." : "This product revision is read-only here. The backend controls its publication and review state."}</p></div>
      <span className={styles.state}>{product.publicationState.replaceAll("_", " ")}</span>
    </header>

    <section className={prototypeStyles.revisionBanner} aria-label="Draft and published revision safety">
      <span className={prototypeStyles.infoIcon} aria-hidden="true">i</span>
      <div><strong>{editable ? `You're editing draft version ${product.contentVersion}` : `Product state: ${product.publicationState.replaceAll("_", " ").toLocaleLowerCase()}`}</strong>
        <p>{editable ? "These edits remain in this brand's draft until Renivet independently approves and publishes the submitted revision. Changes cannot silently replace the current live listing." : "This screen cannot alter the publication state. Use the authorized workflow to create and submit a new draft revision."}</p>
      </div>
    </section>
    <nav className={prototypeStyles.stepper} aria-label="Product editor steps">
      {[
        { label: "Details", done: readinessChecks[0]?.ready ?? false },
        { label: "Sizes & colours", done: readinessChecks[1]?.ready ?? false },
        { label: "Photos", done: (readinessChecks[2]?.ready ?? false) && (readinessChecks[3]?.ready ?? false) },
        { label: "Prices", done: readinessChecks[4]?.ready ?? false },
        { label: "Claims & evidence", done: readinessChecks[5]?.ready ?? false },
        { label: "Review & submit", done: !editable },
      ].map((step, index) => <button key={step.label} type="button"
        aria-current={activeStep === index ? "step" : undefined}
        onClick={() => goToStep(index)}
        className={prototypeStyles.stepButton + (activeStep === index ? " " + prototypeStyles.stepSelected : "")}>
        <span className={prototypeStyles.stepNumber + (step.done ? " " + prototypeStyles.stepDone : "")} aria-hidden="true">{step.done ? "✓" : index + 1}</span>
        <span>{step.label}</span>
      </button>)}
    </nav>

    <div hidden={activeStep !== 0}>
    <section className={styles.formPanel} aria-labelledby="details-heading">
      <div className={styles.formHeading}><div><p className={styles.kicker}>PRODUCT DETAILS</p><h2 id="details-heading">Continue where you left off</h2><p>Update the parent product details. Variants, images, prices and claims stay in their own workflow steps.</p></div><span className={styles.draftBadge}>SCHEMA V{product.categorySchemaVersion}</span></div>
      {!editable && <div className={styles.readOnlyNotice} role="status">This product is {product.publicationState.toLowerCase().replaceAll("_", " ")} and is read-only in this draft editor. No lifecycle action is available here.</div>}
      <form onSubmit={saveDraft}>
        <div className={styles.formGrid}>
          <div className={styles.fieldWide}><label htmlFor="detail-title-input">Product name</label><input id="detail-title-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} disabled={!editable} /><small>Give your product a clear, searchable name.</small></div>
          <div className={styles.fieldWide}><label htmlFor="detail-description-input">Description (optional)</label><textarea id="detail-description-input" rows={4} maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} disabled={!editable} placeholder="Describe the look, feel, material and making of your product." /><small>Describe the product accurately. Keep sustainability claims in their own review step.</small></div>
          {productFields.map((field) => <AttributeEditor key={`${field.scope}-${field.code}`} field={field} value={attributes[field.code]} disabled={!editable} onChange={(value) => setAttributes((current) => ({ ...current, [field.code]: value }))} />)}
        </div>
        {schema && <div className={styles.schemaPanel}><div><p className={styles.kicker}>PINNED CATEGORY SCHEMA</p><h3>{schema.state === "PUBLISHED" ? "Published schema" : "Draft schema"} · version {schema.version}</h3><p>Attributes are shown from the exact version pinned to this product draft.</p></div><p className={styles.schemaLoading}>{productFields.length} product field{productFields.length === 1 ? "" : "s"} · {schema.validatorVersion}</p></div>}
        {saveError && <div className={styles.error} role="alert">{saveError}{saveError.includes("another tab") && <button type="button" className={styles.textButton} onClick={() => setReloadKey((key) => key + 1)}>Reload latest draft</button>}</div>}
        {saveNotice && <p className={styles.notice} role="status">{saveNotice}</p>}
        <div className={styles.formActions}><p>Saving updates this draft only.</p>{editable && <button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>}</div>
      </form>
    </section>
    </div>
    <div hidden={activeStep !== 1}>
      <section className={styles.formPanel} aria-labelledby="variants-heading">
        <ProductVariantMatrix brandId={brandId} productId={productId} product={product} fields={variantFields} editable={editable} onChanged={() => setReloadKey((key) => key + 1)} />
        <details className={prototypeStyles.advancedVariant}>
          <summary>Advanced SKU options — edit, deactivate, or add an individual variant</summary>
      {product.variants.length > 0 && <div className={styles.tableWrap}><table className={styles.variantTable}><caption className={styles.visuallyHidden}>Product SKU variants</caption><thead><tr><th scope="col">SKU</th><th scope="col">Options</th><th scope="col">State</th><th scope="col">Image scan</th>{editable && <th scope="col">Draft actions</th>}</tr></thead><tbody>{product.variants.map((variant) => <tr key={variant.id}><th scope="row">{variant.sku}</th><td>{Object.entries(variant.options).map(([key, value]) => `${key}: ${value}`).join(" · ") || "No options"}</td><td>{variant.variantState.replaceAll("_", " ")}</td><td>{variant.mediaLinks?.map((media) => media.scanState).join(", ") || "No variant image"}</td>{editable && <td>{variant.variantState === "INACTIVE" ? <span>Retired</span> : <div className={styles.mediaActions}><button type="button" className={styles.textButton} disabled={variantSaving} onClick={() => editingVariantId === variant.id ? setEditingVariantId(null) : startVariantEdit(variant.id, variant.options)}>{editingVariantId === variant.id ? "Cancel edit" : "Edit SKU options"}</button>{confirmingDeactivationId === variant.id ? <><button type="button" className={styles.textButton} disabled={variantSaving} onClick={() => void deactivateVariant(variant.id)}>Confirm deactivation</button><button type="button" className={styles.textButton} disabled={variantSaving} onClick={() => setConfirmingDeactivationId(null)}>Keep SKU</button></> : <button type="button" className={styles.textButton} disabled={variantSaving} onClick={() => { setVariantError(""); setConfirmingDeactivationId(variant.id); }}>Deactivate SKU</button>}</div>}</td>}</tr>)}</tbody></table></div>}
      {editingVariantId && editable && <div className={styles.schemaPanel} aria-labelledby="edit-variant-heading"><div><p className={styles.kicker}>EDIT SKU OPTIONS</p><h3 id="edit-variant-heading">Update the variant</h3><p>The SKU itself is permanent. Changes use this SKU’s current version and can be rejected if another SKU or a dependent record conflicts.</p></div><div className={styles.formGrid}>{variantFields.filter((field) => field.type === "enum" || field.type === "text").map((field) => <div className={styles.field} key={field.code}><label htmlFor={`edit-variant-${field.code}`}>{field.code.replaceAll("_", " ")}{field.required && " *"}</label>{field.type === "enum" ? <select id={`edit-variant-${field.code}`} value={editVariantOptions[field.code] ?? ""} onChange={(event) => setEditVariantOptions((current) => ({ ...current, [field.code]: event.target.value }))}><option value="">Choose an option</option>{(field.allowedValues ?? []).map((value) => <option key={value} value={value}>{value}</option>)}</select> : <input id={`edit-variant-${field.code}`} value={editVariantOptions[field.code] ?? ""} onChange={(event) => setEditVariantOptions((current) => ({ ...current, [field.code]: event.target.value }))} maxLength={128} />}</div>)}</div><div className={styles.formActions}><p>Changes are saved only to this draft.</p><button type="button" className={styles.primaryButton} disabled={variantSaving} onClick={() => void saveVariant(editingVariantId)}>{variantSaving ? "Saving SKU…" : "Save SKU changes"}</button></div></div>}
      {variantError && <p className={styles.error} role="alert">{variantError}</p>}
      {editable ? <form onSubmit={createVariant} noValidate><div className={styles.formGrid}>
        <div className={styles.field}><label htmlFor="variant-sku">SKU <span aria-hidden="true">*</span></label><input id="variant-sku" value={variantSku} onChange={(event) => setVariantSku(event.target.value)} maxLength={40} autoComplete="off" /></div>
        {variantFields.filter((field) => field.type === "enum" || field.type === "text").map((field) => <div className={styles.field} key={field.code}><label htmlFor={`variant-${field.code}`}>{field.code.replaceAll("_", " ")}{field.required && " *"}</label>{field.type === "enum" ? <select id={`variant-${field.code}`} value={variantOptions[field.code] ?? ""} onChange={(event) => setVariantOptions((current) => ({ ...current, [field.code]: event.target.value }))}><option value="">Choose an option</option>{(field.allowedValues ?? []).map((value) => <option key={value} value={value}>{value}</option>)}</select> : <input id={`variant-${field.code}`} value={variantOptions[field.code] ?? ""} onChange={(event) => setVariantOptions((current) => ({ ...current, [field.code]: event.target.value }))} maxLength={128} />}</div>)}
      </div>{variantFields.some((field) => field.type !== "enum" && field.type !== "text") && <p className={styles.inlineError}>Some pinned variant fields use types the current variant API cannot safely submit. Those fields are left out; the server will reject incomplete variants.</p>}
      <div className={styles.formActions}><p>Combination: {canonicalVariantOptions(variantOptions)}</p><button className={styles.primaryButton} type="submit" disabled={variantSaving || variantFields.length === 0}>{variantSaving ? "Adding SKU…" : "Add SKU"}</button></div></form> : <p className={styles.readOnlyNotice} role="status">Variants are read-only after the draft enters review or publication.</p>}

        </details>
      </section>
    </div>
    <div hidden={activeStep !== 2}>
      <ProductMediaWorkspace brandId={brandId} productId={productId} product={product} editable={editable} onChanged={() => setReloadKey((key) => key + 1)} />
    </div>
    <div hidden={activeStep !== 3}>
    <section className={styles.formPanel} aria-labelledby="prices-heading">
      <div className={styles.formHeading}><div><p className={styles.kicker}>PRICE HISTORY</p><h2 id="prices-heading">Price proposals</h2><p>Only backend price states are shown. A pending proposal is not an approved selling price.</p></div></div>
      <div className={prototypeStyles.priceSplit}>
      <div className={prototypeStyles.priceHistory}>
      {product.variants.some((variant) => (variant.priceVersions?.length ?? 0) > 0) ? product.variants.map((variant) => {
        if (!variant.priceVersions?.length) return null;
        return <div className={styles.tableWrap} key={variant.id}><table className={styles.variantTable}><caption>Price history · {variant.sku}</caption><thead><tr><th scope="col">Selling price</th><th scope="col">MRP</th><th scope="col">Valid from</th><th scope="col">Valid to</th><th scope="col">State</th></tr></thead><tbody>{variant.priceVersions.map((price) => <tr key={price.id}><td>₹{(price.amountMinor / 100).toFixed(2)}</td><td>₹{(price.mrpMinor / 100).toFixed(2)}</td><td>{new Date(price.validFrom).toLocaleDateString()}</td><td>{price.validTo ? new Date(price.validTo).toLocaleDateString() : "Open-ended"}</td><td>{price.priceState === "PENDING" ? "Pending review" : price.priceState.replaceAll("_", " ")}</td></tr>)}</tbody></table></div>;
      }) : <p className={styles.emptyLine}>No price proposals have been recorded for these SKUs.</p>}
      </div>
      <aside className={prototypeStyles.priceForm}>
      {editable && product.variants.some((variant) => variant.variantState !== "INACTIVE") && <div className={styles.schemaPanel} aria-labelledby="price-proposal-heading">
        <div><p className={styles.kicker}>PROPOSE AN INR PRICE</p><h3 id="price-proposal-heading">Create a pending price proposal</h3><p>Enter the pricing rule version supplied by the authorized pricing service. The UI never guesses this value.</p></div>
        <div className={styles.field}><label htmlFor="price-variant-select">Applies to SKU</label><select id="price-variant-select" value={priceVariantId ?? ""} onChange={(event) => { setPriceVariantId(event.target.value || null); setPriceError(""); setPriceNotice(""); }}>
          <option value="">Choose a SKU</option>{product.variants.filter((variant) => variant.variantState !== "INACTIVE").map((variant) => <option key={variant.id} value={variant.id}>{variant.sku}</option>)}
        </select></div>
        <form onSubmit={proposePrice} noValidate><div className={styles.formGrid}>
          <div className={styles.field}><label htmlFor="selling-price-minor">Selling price (₹)</label><input id="selling-price-minor" type="number" min="0.01" step="0.01" value={sellingPriceMinor} onChange={(event) => setSellingPriceMinor(event.target.value)} required /></div>
          <div className={styles.field}><label htmlFor="mrp-minor">MRP (₹, incl. all taxes)</label><input id="mrp-minor" type="number" min="0.01" step="0.01" value={mrpMinor} onChange={(event) => setMrpMinor(event.target.value)} required /></div>
          <div className={styles.field}><label htmlFor="price-valid-from">Valid from</label><input id="price-valid-from" type="datetime-local" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} required /></div>
          <div className={styles.field}><label htmlFor="price-valid-to">Valid to <span>(optional)</span></label><input id="price-valid-to" type="datetime-local" value={validTo} onChange={(event) => setValidTo(event.target.value)} /></div>
          <div className={styles.field}><label htmlFor="price-rule-version">INR rule version</label><input id="price-rule-version" type="number" min="1" step="1" value={ruleVersion} onChange={(event) => setRuleVersion(event.target.value)} required /><small>Use the version returned by the approved pricing process.</small></div>
          <div className={styles.field}><label htmlFor="price-reason">Reason code <span>(optional)</span></label><input id="price-reason" maxLength={128} value={priceReason} onChange={(event) => setPriceReason(event.target.value)} /></div>
        </div>{priceError && <p className={styles.error} role="alert">{priceError}</p>}{priceNotice && <p className={styles.notice} role="status">{priceNotice}</p>}<div className={styles.formActions}><p>Creates a pending INR proposal; it is not active until independently approved.</p><button type="submit" className={styles.primaryButton} disabled={priceSaving || !priceVariantId}>{priceSaving ? "Submitting price…" : "Send for approval"}</button><button type="button" className={styles.secondaryButton} disabled={priceSaving} onClick={() => setPriceVariantId(null)}>Cancel</button></div></form>
      </div>}
      {!editable && <p className={styles.inlineError}>New price proposals are disabled after submission; review the persisted price history above.</p>}
      </aside>
      </div>
    </section>
    </div>
    <div hidden={activeStep !== 4}>
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
    </div>
    <div hidden={activeStep !== 5}>
    {editable && <section className={styles.formPanel} aria-labelledby="readiness-heading">
      <div className={styles.formHeading}><div><h2 id="readiness-heading">Ready for review?</h2><p>Check the remaining tasks before you send this revision to an independent Renivet reviewer.</p></div></div>
      <ul className={prototypeStyles.reviewChecklist}>
        {readinessChecks.map((check) => <li key={check.label} className={check.ready ? prototypeStyles.reviewReady : prototypeStyles.reviewMissing}>
          <span className={prototypeStyles.reviewMark} aria-hidden="true">{check.ready ? "✓" : "!"}</span>
          <div><strong>{check.label}</strong><small>{check.detail}</small></div>
          {!check.ready && <button type="button" onClick={() => goToStep(check.step)}>Fix</button>}
        </li>)}
      </ul>
    </section>}
    {editable && <section className={styles.formPanel} aria-labelledby="submission-heading">
      <div className={styles.formHeading}><div><p className={styles.kicker}>READY FOR A SEPARATE REVIEW?</p><h2 id="submission-heading">Submit this revision</h2><p>Submission checks the saved product, active SKUs, approved prices and eligible media on the server. Once accepted, this exact revision is frozen for an independent reviewer.</p></div></div>
      {submissionError && <p className={styles.error} role="alert">{submissionError}</p>}
      {submissionNotice && <p className={styles.notice} role="status">{submissionNotice}</p>}
      <div className={styles.formActions}><p>{readinessChecks.filter((check) => !check.ready).length ? readinessChecks.filter((check) => !check.ready).length + " item(s) to fix before submitting." : "Everything needed is in place. The server will verify all requirements again."}</p><button className={styles.primaryButton} type="button" onClick={() => void submitForReview()} disabled={submitting || readinessChecks.some((check) => !check.ready)}>{submitting ? "Submitting revision…" : "Submit version " + product.contentVersion + " for review"}</button></div>
    </section>}
    </div>
    <div className={prototypeStyles.stepNavigation}>
      <button type="button" disabled={activeStep === 0} onClick={() => goToStep(activeStep - 1)}>Back</button>
      <p>Step {activeStep + 1} of 6 · This product stays in draft until approved.</p>
      <button type="button" disabled={activeStep === 5} onClick={() => goToStep(activeStep + 1)}>Next: {["Sizes & colours", "Photos", "Prices", "Claims & evidence", "Review & submit", ""][activeStep]}</button>
    </div>
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
