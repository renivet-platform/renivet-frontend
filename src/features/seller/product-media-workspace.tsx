"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AuthApiError, getCurrentSession } from "@/features/identity/auth-api";
import type { operations } from "@/generated/renivet-api";
import { createIdempotencyKey, W2ApiError, w2Request } from "./w2-catalog";
import styles from "./product-workspace.module.css";
import ui from "./product-editor-prototype.module.css";

type Product = operations["getBrandProduct"]["responses"][200]["content"]["application/json"];
type UploadIntent = operations["beginMediaUpload"]["responses"][201]["content"]["application/json"];
type MediaStatus = operations["getMediaAssetStatus"]["responses"][200]["content"]["application/json"];
type CompleteReceipt = operations["completeMediaUpload"]["responses"][202]["content"]["application/json"];
type AttachBody = operations["attachProductMedia"]["requestBody"]["content"]["application/json"];
type Link = Product["mediaLinks"][number] & { altText?: string };
type Photo = {
  id: string; file: File; preview: string; description: string; role: string; target: string;
  state: "READY" | "UPLOADING" | "SCANNING" | "PENDING" | "ATTACHED" | "FAILED";
  progress: number; error: string; mediaId: string; uploaded: boolean; completed: boolean;
};
const maxImageBytes = 10 * 1024 * 1024;
const acceptedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

function uploadError(error: unknown): string {
  if (error instanceof W2ApiError) {
    if (error.code === "BRAND_ACCESS_DENIED" || error.code === "MEDIA_ACCESS_DENIED") return "This brand needs media.write to upload photos and catalog.write to link them. Ask the brand owner to grant an authorized product-editor role. If this is your brand, apply the latest database migrations.";
    if (error.code === "CSRF_REJECTED" || error.status === 401) return "Your sign-in has expired or the session check failed. Sign out, sign in again and retry.";
    if (error.code === "AUTH_MFA_STEP_UP_REQUIRED") return "The backend still enforces the retired authenticator step-up. Run the current backend with deferred MFA policy.";
    if (error.code === "MEDIA_STORAGE_UNAVAILABLE") return "Private image storage is not configured. Configure DigitalOcean Spaces on the backend.";
    if (error.code === "MEDIA_SCANNER_UNAVAILABLE") return "The image scanner is unavailable. Configure ClamAV before trying again.";
    return error.message;
  }
  if (error instanceof AuthApiError) return error.message;
  return error instanceof Error ? error.message : "The image could not be uploaded. No unverified image has been attached.";
}

async function checksum(file: File): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, "0")).join("");
}

function colourOf(options: Record<string, string>): string {
  return options.color ?? options.colour ?? "";
}
function labelFor(value: string): string { return value.replaceAll("_", " "); }

export function ProductMediaWorkspace({ brandId, productId, product, editable, onChanged }: {
  brandId: string; productId: string; product: Product; editable: boolean; onChanged: () => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [rightsAttested, setRightsAttested] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [linkBusy, setLinkBusy] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState<Record<string,string>>({});
  const objectUrls = useRef<Set<string>>(new Set());
  useEffect(() => () => { for (const url of objectUrls.current) URL.revokeObjectURL(url); objectUrls.current.clear(); }, []);

  const linked = useMemo(() => {
    const parents = product.mediaLinks.map((link) => ({ ...link, target: "All variants" }));
    const variants = product.variants.flatMap((variant) => (variant.mediaLinks ?? []).map((link) => ({
      ...link, target: variant.sku,
    })));
    return [...parents, ...variants] as Array<Link & { target: string }>;
  }, [product]);
  const colours = useMemo(() => Array.from(new Set(product.variants
    .filter((variant) => variant.variantState !== "INACTIVE")
    .map((variant) => colourOf(variant.options)).filter(Boolean))), [product.variants]);

  useEffect(() => {
    let active = true;
    const seen = Array.from(new Set(linked.map((link) => link.mediaAssetId)));
    void Promise.all(seen.map(async (id) => {
      try {
        const current = await w2Request<MediaStatus>(["brands", brandId, "media", id]);
        return [id, current.scanState === "CLEAN" ? current.safePreviewUrl : null] as const;
      } catch { return [id, null] as const; }
    })).then((rows) => {
      if (active) setPreviews(Object.fromEntries(rows.filter((row): row is readonly [string,string] => typeof row[1] === "string")));
    });
    return () => { active = false; };
  }, [brandId, linked]);

  function patchPhoto(id: string, changes: Partial<Photo>): void {
    setPhotos((current) => current.map((photo) => photo.id === id ? { ...photo, ...changes } : photo));
  }

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const list = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!list.length) return;
    setError(""); setNotice("");
    const invalid = list.filter((file) => !acceptedMime.has(file.type) || file.size < 1 || file.size > maxImageBytes);
    if (invalid.length) setError(String(invalid.length) + " file(s) were skipped. Select JPG, PNG or WebP under 10 MiB each.");
    const additions: Photo[] = list.filter((file) => !invalid.includes(file)).map((file, index) => {
      const preview = URL.createObjectURL(file);
      objectUrls.current.add(preview);
      return {
        id: crypto.randomUUID(), file, preview, description: "", target: "",
        role: linked.length === 0 && photos.length === 0 && index === 0 ? "primary" : "gallery",
        state: "READY", progress: 0, error: "", mediaId: "", uploaded: false, completed: false,
      };
    });
    setPhotos((current) => [...current, ...additions]);
  }

  function removePending(id: string) {
    setPhotos((current) => {
      const selected = current.find((photo) => photo.id === id);
      if (selected) { URL.revokeObjectURL(selected.preview); objectUrls.current.delete(selected.preview); }
      return current.filter((photo) => photo.id !== id);
    });
  }

  function targetsOf(value: string): string[] {
    if (!value) return [""];
    if (value.startsWith("colour:")) {
      const colour = value.slice("colour:".length);
      return product.variants.filter((variant) => variant.variantState !== "INACTIVE" && colourOf(variant.options) === colour).map((variant) => variant.id);
    }
    return [value];
  }

  async function privatePut(intent: UploadIntent, file: File, id: string): Promise<void> {
    const url = new URL(intent.uploadUrl);
    if (url.protocol !== "https:" || intent.uploadMethod !== "PUT") throw new Error("The private image-upload link was not valid.");
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", url.toString(), true);
      request.withCredentials = false;
      Object.entries(intent.headers).forEach(([key, value]) => request.setRequestHeader(key, value));
      request.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) patchPhoto(id, { progress: Math.round(event.loaded * 100 / event.total) });
      });
      request.addEventListener("load", () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Private storage rejected the image. Check Spaces configuration and CORS.")));
      request.addEventListener("error", () => reject(new Error("Could not connect to private image storage. Check storage CORS and network access.")));
      request.addEventListener("abort", () => reject(new Error("Upload cancelled.")));
      request.send(file);
    });
  }

  async function attachMedia(assetId: string, photo: Photo, csrfToken: string, counts: Record<string,number>) {
    const destinations = targetsOf(photo.target);
    if (!destinations.length) throw new Error("There are no active SKUs for that colour. Choose another photo destination.");
    for (const variantId of destinations) {
      const savedCount = variantId
        ? product.variants.find((variant) => variant.id === variantId)?.mediaLinks?.length ?? 0
        : product.mediaLinks.length;
      const order = savedCount + (counts[variantId] ?? 0);
      const body: AttachBody = {
        mediaAssetId: assetId, displayRole: photo.role,
        displayOrder: order, altText: photo.description.trim(),
        ...(variantId ? { variantId } : {}),
      };
      await w2Request(["brands", brandId, "products", productId, "media"], {
        method: "POST", body, csrfToken, idempotencyKey: "attach-" + photo.id + "-" + variantId.replaceAll("-", "").slice(0, 18),
      });
      counts[variantId] = (counts[variantId] ?? 0) + 1;
    }
  }

  async function uploadSelected() {
    if (!editable || busy) return;
    const ready = photos.filter((photo) => photo.state === "READY" || photo.state === "FAILED" || photo.state === "PENDING");
    if (!ready.length) return;
    if (!rightsAttested) { setError("Confirm that your brand has permission to use all selected photos before uploading."); return; }
    const missing = ready.filter((photo) => !photo.description.trim());
    if (missing.length) { setError("Add a description to each photo before uploading."); return; }
    setBusy(true); setError(""); setNotice("");
    let success = 0;
    const counts: Record<string,number> = {};
    try {
      const session = await getCurrentSession();
      for (const photo of ready) {
        try {
          let assetId = photo.mediaId;
          const digest = await checksum(photo.file);
          if (!photo.uploaded) {
            patchPhoto(photo.id, { state: "UPLOADING", error: "", progress: 0 });
            // Reuse the upload key on retry: a failed PUT must not skip the private upload.
            const intent = await w2Request<UploadIntent>(["brands", brandId, "media"], {
              method: "POST", body: {
                fileName: photo.file.name, mimeType: photo.file.type, byteLength: photo.file.size,
                rightsAttested: true, sha256: digest,
              }, csrfToken: session.csrfToken, idempotencyKey: photo.id,
            });
            assetId = intent.mediaAssetId;
            patchPhoto(photo.id, { mediaId: assetId });
            await privatePut(intent, photo.file, photo.id);
            patchPhoto(photo.id, { uploaded: true, state: "SCANNING", progress: 100 });
          }
          if (!assetId) throw new Error("The media upload did not return an asset identifier.");
          if (!photo.completed) {
            const complete = await w2Request<CompleteReceipt>(["brands", brandId, "media", assetId, "complete"], {
              method: "POST", body: { sha256: digest, sizeBytes: photo.file.size },
              csrfToken: session.csrfToken, idempotencyKey: "complete-" + photo.id,
            });
            if (!complete.id) throw new Error("The image scan did not return a valid completion receipt.");
            patchPhoto(photo.id, { completed: true });
          }
          const status = await w2Request<MediaStatus>(["brands", brandId, "media", assetId]);
          if (status.scanState === "REJECTED") throw new Error("The image failed security or format checks and cannot be attached.");
          if (status.scanState !== "CLEAN" || status.rightsState !== "ATTESTED" || status.derivativeState !== "READY") {
            patchPhoto(photo.id, { state: "PENDING", progress: 100, mediaId: assetId, error: "Security checks are still running. Select Check again to retry attachment." });
            continue;
          }
          await attachMedia(assetId, photo, session.csrfToken, counts);
          patchPhoto(photo.id, { state: "ATTACHED", error: "", progress: 100, mediaId: assetId, uploaded: true, completed: true });
          success += 1;
        } catch (caught) {
          patchPhoto(photo.id, { state: "FAILED", error: uploadError(caught) });
        }
      }
      if (success) { setNotice(String(success) + " photo" + (success === 1 ? "" : "s") + " uploaded, checked and attached to this product."); onChanged(); }
      if (success < ready.length) setError(String(ready.length - success) + " photo(s) still need attention. Fix the indicated problem and retry only those files.");
    } catch (caught) { setError(uploadError(caught)); }
    finally { setBusy(false); }
  }

  async function updateLink(link: Link, patch: { altText?: string; displayRole?: string }) {
    if (!editable || linkBusy) return;
    setLinkBusy(link.id); setError(""); setNotice("");
    try {
      const session = await getCurrentSession();
      await w2Request(["brands", brandId, "products", productId, "media", link.id], {
        method: "PATCH", body: patch, csrfToken: session.csrfToken,
        idempotencyKey: createIdempotencyKey(), ifMatch: '"' + product.rowVersion + '"',
      });
      setNotice("Photo details saved."); onChanged();
    } catch (caught) { setError(uploadError(caught)); }
    finally { setLinkBusy(null); }
  }

  async function removeLink(link: Link) {
    if (!editable || linkBusy || !window.confirm("Remove this photo link? The private original and its audit history are retained.")) return;
    setLinkBusy(link.id); setError(""); setNotice("");
    try {
      const session = await getCurrentSession();
      await w2Request(["brands", brandId, "products", productId, "media", link.id], {
        method: "DELETE", csrfToken: session.csrfToken,
        idempotencyKey: createIdempotencyKey(), ifMatch: '"' + product.rowVersion + '"',
      });
      setNotice("Photo removed from this product."); onChanged();
    } catch (caught) { setError(uploadError(caught)); }
    finally { setLinkBusy(null); }
  }

  const outstanding = photos.filter((photo) => photo.state !== "ATTACHED").length;

  return <section className={styles.formPanel} aria-labelledby="media-heading">
    <div className={styles.formHeading}>
      <div><p className={styles.kicker}>PRODUCT PHOTOGRAPHY</p><h2 id="media-heading">Photos</h2><p>Upload multiple photos. Link them to all variants, one colour, or a specific SKU. Only scanned, rights-attested photos can be attached.</p></div>
      <span className={styles.draftBadge}>{linked.length} linked</span>
    </div>
    <div className={ui.mediaGuide}><p>Photo guidelines</p><ul>
      <li>JPG, PNG or WebP; maximum 10 MiB per photo (the backend limit).</li>
      <li>Use clear photos of the actual product, ideally a front view, rear view and close-ups.</li>
      <li>Avoid watermarks, promotional text and price stickers.</li>
      <li>Write a short, useful description for every image.</li>
    </ul></div>
    {linked.length > 0 && <div className={ui.mediaGallery} aria-label="Attached product photos">
      {linked.map((link) => <div className={ui.mediaTile} key={link.id}>
        {previews[link.mediaAssetId] ? <Image unoptimized src={previews[link.mediaAssetId]} alt={link.altText || "Product image"} width={320} height={400} className={ui.mediaThumbnail} /> : <div className={ui.mediaThumbnail}>Secure preview unavailable</div>}
        <div className={ui.mediaTileBody}>
          <strong>{labelFor(link.displayRole)} photo</strong><small>{link.target} · {link.scanState} · {link.rightsState}</small>
          <label htmlFor={"linked-alt-" + link.id}>Description</label>
          <textarea id={"linked-alt-" + link.id} rows={2} disabled={!editable} maxLength={500} value={editDescription[link.id] ?? link.altText ?? ""} onChange={(event) => setEditDescription((current) => ({ ...current, [link.id]: event.target.value }))} />
          {editable && <div className={ui.mediaTileActions}>
            <button type="button" disabled={Boolean(linkBusy)} onClick={() => void updateLink(link, { altText: editDescription[link.id] ?? link.altText ?? "" })}>Save description</button>
            {link.displayRole !== "primary" && <button type="button" disabled={Boolean(linkBusy)} onClick={() => void updateLink(link, { displayRole: "primary" })}>Set as main</button>}
            <button type="button" disabled={Boolean(linkBusy)} onClick={() => void removeLink(link)}>Remove</button>
          </div>}
        </div>
      </div>)}
    </div>}
    {!linked.length && <p className={styles.emptyLine}>No photos attached. Upload product photos to prepare the listing for review.</p>}
    {editable && <>
      <label className={ui.optionAdd} htmlFor="media-file" style={{ display: "inline-block", padding: "13px 18px", borderRadius: "8px", marginTop: "16px", cursor: "pointer" }}>+ Select photos</label>
      <input id="media-file" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseFiles} disabled={busy} style={{ display: "block", marginTop: "10px", width: "100%", maxWidth: "340px" }} />
      {photos.length > 0 && <div className={ui.mediaGallery} aria-label="New photos ready for upload">
        {photos.map((photo) => <div key={photo.id} className={ui.mediaTile}>
          <Image unoptimized src={photo.preview} alt={photo.description || photo.file.name} width={320} height={400} className={ui.mediaThumbnail} />
          <div className={ui.mediaTileBody}>
            <strong>{photo.file.name}</strong><small>{(photo.file.size / (1024 * 1024)).toFixed(2)} MiB · {photo.state.toLowerCase()}</small>
            <label htmlFor={"new-photo-alt-" + photo.id}>Image description *</label>
            <textarea id={"new-photo-alt-" + photo.id} rows={2} maxLength={500} disabled={busy || photo.state === "ATTACHED"} value={photo.description} onChange={(event) => patchPhoto(photo.id, { description: event.target.value })} placeholder="e.g. Navy jacket, front view" />
            <label htmlFor={"new-photo-target-" + photo.id}>Show for</label>
            <select id={"new-photo-target-" + photo.id} value={photo.target} disabled={busy || photo.state === "ATTACHED"} onChange={(event) => patchPhoto(photo.id, { target: event.target.value })}>
              <option value="">All variants (parent product)</option>
              {colours.map((colour) => <option value={"colour:" + colour} key={colour}>All sizes in {labelFor(colour)}</option>)}
              {product.variants.filter((variant) => variant.variantState !== "INACTIVE").map((variant) => <option value={variant.id} key={variant.id}>SKU: {variant.sku}</option>)}
            </select>
            <label htmlFor={"new-photo-role-" + photo.id}>Display role</label>
            <select id={"new-photo-role-" + photo.id} value={photo.role} disabled={busy || photo.state === "ATTACHED"} onChange={(event) => patchPhoto(photo.id, { role: event.target.value })}>
              <option value="primary">Main photo</option><option value="gallery">Gallery photo</option><option value="detail">Detail / close-up</option>
            </select>
            {photo.progress > 0 && photo.state !== "ATTACHED" && <progress max={100} value={photo.progress} aria-label={"Upload progress for " + photo.file.name} />}
            {photo.error && <p className={styles.error} role="alert">{photo.error}</p>}
            <div className={ui.mediaTileActions}>
              {(photo.state === "READY" || photo.state === "FAILED" || photo.state === "PENDING") && <button type="button" disabled={busy} onClick={() => removePending(photo.id)}>Remove from queue</button>}
              {photo.state === "PENDING" && <button type="button" disabled={busy} onClick={() => void uploadSelected()}>Check again</button>}
              {photo.state === "ATTACHED" && <span className={ui.savedTag}>Attached</span>}
            </div>
          </div>
        </div>)}
      </div>}
      <label className={styles.checkboxLabel}><input type="checkbox" checked={rightsAttested} onChange={(event) => setRightsAttested(event.target.checked)} disabled={busy} /> I confirm this brand owns these photos or has the rights required to use them.</label>
      <div className={styles.formActions}><p>Photos stay private until malware scanning, integrity and rights checks pass.</p>
        <button type="button" className={styles.primaryButton} disabled={busy || outstanding === 0} onClick={() => void uploadSelected()}>{busy ? "Processing photos…" : photos.some((photo) => photo.state === "PENDING") ? "Finish checking photos" : "Upload " + outstanding + " photo" + (outstanding === 1 ? "" : "s")}</button>
      </div>
    </>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {!editable && <p role="status" className={styles.readOnlyNotice}>This revision is read-only. Photos can be changed only in an editable draft.</p>}
  </section>;
}
