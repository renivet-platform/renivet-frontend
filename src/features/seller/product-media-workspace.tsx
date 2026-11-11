"use client";

import { useState } from "react";
import { AuthApiError, getCurrentSession, stepUpWithMfa } from "@/features/identity/auth-api";
import type { operations } from "@/generated/renivet-api";
import { createIdempotencyKey, W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./product-workspace.module.css";

type ProductDetail = operations["getBrandProduct"]["responses"][200]["content"]["application/json"];
type UploadIntent = operations["beginMediaUpload"]["responses"][201]["content"]["application/json"];
type MediaStatus = operations["getMediaAssetStatus"]["responses"][200]["content"]["application/json"];
type CompleteReceipt = operations["completeMediaUpload"]["responses"][202]["content"]["application/json"];
type AttachBody = operations["attachProductMedia"]["requestBody"]["content"]["application/json"];

const maxImageBytes = 10 * 1024 * 1024;
const acceptedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeError(error: unknown): string {
  if (error instanceof W2ApiError || error instanceof AuthApiError) return error.message;
  return "The image workflow could not be completed. Your product draft is unchanged.";
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function ProductMediaWorkspace({ brandId, productId, product, editable, onChanged }: {
  brandId: string; productId: string; product: ProductDetail; editable: boolean; onChanged: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [rightsAttested, setRightsAttested] = useState(false);
  const [altText, setAltText] = useState("");
  const [displayRole, setDisplayRole] = useState("primary");
  const [variantId, setVariantId] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [status, setStatus] = useState<MediaStatus | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (!editable) return;
    if (!file || !acceptedMime.has(file.type) || file.size < 1 || file.size > maxImageBytes) {
      setError("Choose a JPEG, PNG or WebP image up to 10 MiB."); return;
    }
    if (!rightsAttested) { setError("Confirm that your brand has the rights required to use this image."); return; }
    if (!altText.trim()) { setError("Add concise alt text so this image is accessible."); return; }
    if (!/^(?:\d{6}|[A-Z2-7]{26})$/.test(mfaCode.trim().toUpperCase())) { setError("Enter a six-digit authenticator code or an unused recovery code."); return; }
    setBusy(true);
    try {
      const digest = await sha256(file);
      const session = await getCurrentSession();
      const elevated = await stepUpWithMfa(mfaCode.trim().toUpperCase(), session.csrfToken);
      const intent = await w2Request<UploadIntent>(["brands", brandId, "media"], {
        method: "POST", body: { fileName: file.name, mimeType: file.type, byteLength: file.size, rightsAttested: true, sha256: digest },
        csrfToken: elevated.csrfToken, idempotencyKey: createIdempotencyKey(),
      });
      const uploadUrl = new URL(intent.uploadUrl);
      if (uploadUrl.protocol !== "https:" || intent.uploadMethod !== "PUT") throw new Error("Upload intent is invalid.");
      const putResponse = await fetch(uploadUrl, { method: "PUT", headers: intent.headers, body: file, credentials: "omit", redirect: "error" });
      if (!putResponse.ok) throw new Error("The private image upload did not complete. Try again with a new upload.");
      const receipt = await w2Request<CompleteReceipt>(["brands", brandId, "media", intent.mediaAssetId, "complete"], {
        method: "POST", body: { sha256: digest, sizeBytes: file.size }, csrfToken: elevated.csrfToken, idempotencyKey: createIdempotencyKey(),
      });
      setMediaId(intent.mediaAssetId);
      setNotice(`Upload received. Scan status: ${receipt.status}. The image cannot be attached until scanning and rights checks pass.`);
      setStatus(await w2Request<MediaStatus>(["brands", brandId, "media", intent.mediaAssetId]));
      setMfaCode("");
    } catch (caught) { setError(safeError(caught)); }
    finally { setBusy(false); }
  }

  async function checkStatus() {
    if (!mediaId) return;
    setBusy(true); setError("");
    try { setStatus(await w2Request<MediaStatus>(["brands", brandId, "media", mediaId])); }
    catch (caught) { setError(safeError(caught)); }
    finally { setBusy(false); }
  }

  async function attach() {
    if (!status || status.scanState !== "CLEAN" || status.rightsState !== "ATTESTED" || !mediaId) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const session = await getCurrentSession();
      const body: AttachBody = { mediaAssetId: mediaId, displayRole: displayRole.trim(), displayOrder: product.mediaLinks.length, altText: altText.trim(), ...(variantId ? { variantId } : {}) };
      await w2Request(["brands", brandId, "products", productId, "media"], { method: "POST", body, csrfToken: session.csrfToken, idempotencyKey: createIdempotencyKey() });
      setNotice("Clean image attached to the product."); setMediaId(""); setStatus(null); setFile(null); setAltText(""); setRightsAttested(false); onChanged();
    } catch (caught) { setError(safeError(caught)); }
    finally { setBusy(false); }
  }

  async function move(linkId: string, order: number) {
    setBusy(true); setError("");
    try {
      const session = await getCurrentSession();
      await w2Request(["brands", brandId, "products", productId, "media", linkId], { method: "PATCH", body: { displayOrder: order }, csrfToken: session.csrfToken, idempotencyKey: createIdempotencyKey(), ifMatch: `"${product.rowVersion}"` });
      onChanged();
    } catch (caught) { setError(safeError(caught)); }
    finally { setBusy(false); }
  }

  return <section className={styles.formPanel} aria-labelledby="media-heading">
    <div className={styles.formHeading}><div><p className={styles.kicker}>PRODUCT IMAGERY</p><h2 id="media-heading">Images and scan status</h2><p>Images stay private until the backend confirms rights, file integrity and malware scan status.</p></div><span className={styles.draftBadge}>{product.mediaLinks.length} linked</span></div>
    {product.mediaLinks.length > 0 && <ol className={styles.mediaList}>{[...product.mediaLinks].sort((a, b) => a.displayOrder - b.displayOrder).map((link, index) => <li key={link.id}><div><strong>{link.displayRole}</strong><small>Scan: {link.scanState} · rights: {link.rightsState} · order {link.displayOrder}</small></div><div className={styles.mediaActions}><button type="button" className={styles.textButton} disabled={busy || index === 0} onClick={() => move(link.id, Math.max(0, link.displayOrder - 1))}>Move earlier</button><button type="button" className={styles.textButton} disabled={busy || index === product.mediaLinks.length - 1} onClick={() => move(link.id, link.displayOrder + 1)}>Move later</button></div></li>)}</ol>}
    {editable && <form onSubmit={upload} noValidate><div className={styles.formGrid}>
      <div className={styles.fieldWide}><label htmlFor="media-file">Choose an image</label><input id="media-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><small>JPEG, PNG or WebP. Maximum 10 MiB.</small></div>
      <div className={styles.field}><label htmlFor="media-alt">Image description</label><input id="media-alt" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={500} /></div>
      <div className={styles.field}><label htmlFor="media-role">Display role</label><input id="media-role" value={displayRole} onChange={(event) => setDisplayRole(event.target.value)} maxLength={64} /></div>
      {product.variants.length > 0 && <div className={styles.field}><label htmlFor="media-variant">Attach to</label><select id="media-variant" value={variantId} onChange={(event) => setVariantId(event.target.value)}><option value="">Parent product</option>{product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.sku}</option>)}</select></div>}
      <div className={styles.fieldWide}><label className={styles.checkboxLabel}><input type="checkbox" checked={rightsAttested} onChange={(event) => setRightsAttested(event.target.checked)} /> I confirm this brand has the rights required to use this image.</label></div>
      <div className={styles.fieldWide}><label htmlFor="media-mfa">Authenticator or recovery code</label><input id="media-mfa" autoComplete="one-time-code" inputMode="text" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} maxLength={26} /><small>Required for the protected upload. A successful check rotates your session and lasts five minutes.</small></div>
    </div>
    {mediaId && status && <div className={styles.schemaPanel} role="status"><div><p className={styles.kicker}>SCAN STATUS</p><h3>{status.scanState} · {status.rightsState}</h3><p>{status.scanState === "CLEAN" && status.rightsState === "ATTESTED" ? "Checks passed. You can attach this image now." : "This image stays private until all checks pass."}</p></div><div className={styles.mediaActions}><button type="button" className={styles.secondaryButton} disabled={busy} onClick={checkStatus}>Check status</button>{status.scanState === "CLEAN" && status.rightsState === "ATTESTED" && <button type="button" className={styles.primaryButton} disabled={busy} onClick={attach}>Attach image</button>}</div></div>}
    {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
    {!mediaId && <div className={styles.formActions}><p>No image is made public by this step.</p><button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Uploading securely…" : "Upload image"}</button></div>}</form>}
    {!editable && <p className={styles.readOnlyNotice} role="status">Images cannot be changed while the product is in {product.publicationState.toLowerCase().replaceAll("_", " ")} state.</p>}
  </section>;
}
