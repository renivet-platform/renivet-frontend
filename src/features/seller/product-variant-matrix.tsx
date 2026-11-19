"use client";

import { useMemo, useState, type FormEvent } from "react";
import { getCurrentSession } from "@/features/identity/auth-api";
import type { operations } from "@/generated/renivet-api";
import { canonicalVariantOptions, createIdempotencyKey, hasVariantCombination, type CategoryAttribute, W2ApiError, w2Request } from "./w2-catalog";
import styles from "./product-workspace.module.css";
import ui from "./product-editor-prototype.module.css";

type Product = operations["getBrandProduct"]["responses"][200]["content"]["application/json"];
type OptionField = CategoryAttribute;
type PendingRow = { key: string; size: string; colour: string; options: Record<string,string>; sku: string };

function idFor(size: string, colour: string): string { return JSON.stringify([size, colour]); }
function readable(code: string): string { return code.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function skuPiece(text: string): string { return text.normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toUpperCase(); }
function suggestedSku(style: string, size: string, colour: string): string {
  const suffix = "-" + skuPiece(colour).slice(0, 10) + "-" + skuPiece(size).slice(0, 8);
  return (skuPiece(style).slice(0, 40 - suffix.length) + suffix).slice(0, 40);
}

export function ProductVariantMatrix({ brandId, productId, product, fields, editable, onChanged }: {
  brandId: string; productId: string; product: Product; fields: OptionField[]; editable: boolean; onChanged: () => void;
}) {
  const sizeField = fields.find((field) => ["size", "sizes"].includes(field.code.toLowerCase()));
  const colourField = fields.find((field) => ["color", "colour"].includes(field.code.toLowerCase()));
  const supportsMatrix = Boolean(sizeField && colourField && ["enum", "text"].includes(sizeField.type) && ["enum", "text"].includes(colourField.type));
  const saved = useMemo(() => product.variants.filter((variant) => variant.variantState !== "INACTIVE"), [product.variants]);
  const [sizes, setSizes] = useState<string[]>(() => Array.from(new Set(saved.map((item) => item.options[sizeField?.code ?? "size"]).filter((value): value is string => Boolean(value)))));
  const [colours, setColours] = useState<string[]>(() => Array.from(new Set(saved.map((item) => item.options[colourField?.code ?? "color"]).filter((value): value is string => Boolean(value)))));
  const [sizeInput, setSizeInput] = useState("");
  const [colourInput, setColourInput] = useState("");
  const [skuOverrides, setSkuOverrides] = useState<Record<string,string>>({});
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const candidateRows = useMemo<PendingRow[]>(() => {
    if (!sizeField || !colourField) return [];
    return sizes.flatMap((size) => colours.map((colour) => {
      const key = idFor(size, colour);
      const options = { [sizeField.code]: size, [colourField.code]: colour };
      return { key, size, colour, options, sku: skuOverrides[key] ?? suggestedSku(product.styleCode, size, colour) };
    }));
  }, [sizeField, colourField, sizes, colours, skuOverrides, product.styleCode]);
  const pending = candidateRows.filter((row) => !excluded.includes(row.key)
    && !hasVariantCombination(row.options, product.variants));
  const total = saved.length + pending.length;

  function addOption(event: FormEvent<HTMLFormElement>, type: "size" | "colour") {
    event.preventDefault(); setError(""); setNotice("");
    const field = type === "size" ? sizeField : colourField;
    const value = (type === "size" ? sizeInput : colourInput).trim();
    if (!field) { setError("This category has no " + type + " variant rule in its published schema."); return; }
    if (!value || value.length > 128) { setError("Choose a " + type + " from the category options."); return; }
    if (field.type === "enum" && !field.allowedValues?.includes(value)) {
      setError("Choose an approved " + type + " from this category."); return;
    }
    const values = type === "size" ? sizes : colours;
    if (values.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      setError(readable(type) + " " + value + " is already selected."); return;
    }
    if (type === "size") { setSizes((prev) => [...prev, value]); setSizeInput(""); }
    else { setColours((prev) => [...prev, value]); setColourInput(""); }
  }

  async function saveMatrix() {
    if (busy || !editable || !pending.length) return;
    setError(""); setNotice("");
    const existingCodes = new Set(saved.map((row) => row.sku.toLowerCase()));
    for (const row of pending) {
      if (!/^[A-Za-z0-9_.-]{1,40}$/.test(row.sku) || existingCodes.has(row.sku.toLowerCase())) {
        setError("Every SKU must have a unique code of up to 40 letters, numbers, dots, dashes or underscores."); return;
      }
      existingCodes.add(row.sku.toLowerCase());
    }
    const unsupported = fields.filter((field) => field.required && field.code !== sizeField?.code && field.code !== colourField?.code);
    if (unsupported.length) {
      setError("This category also requires these variant details: " + unsupported.map((field) => readable(field.code)).join(", ") + ". Use Advanced SKU options or update the category configuration before generating a matrix.");
      return;
    }
    setBusy(true);
    let completed = 0;
    try {
      const session = await getCurrentSession();
      let rowVersion = product.rowVersion;
      for (const row of pending) {
        await w2Request(["brands", brandId, "products", productId, "variants"], {
          method: "POST", body: { sku: row.sku, options: row.options },
          csrfToken: session.csrfToken, idempotencyKey: createIdempotencyKey(), ifMatch: '"' + rowVersion + '"',
        });
        completed += 1;
        const refreshed = await w2Request<Product>(["brands", brandId, "products", productId]);
        rowVersion = refreshed.rowVersion;
      }
      setNotice(String(completed) + " SKU" + (completed === 1 ? "" : "s") + " saved to this draft.");
    } catch (caught) {
      if (caught instanceof W2ApiError && caught.status === 409) {
        setError("The SKU matrix changed while saving. Already-created SKUs are kept. Review the refreshed matrix before retrying.");
      } else {
        setError(caught instanceof Error ? caught.message : "The SKU matrix could not be saved. Previously created SKUs are kept.");
      }
    } finally {
      setBusy(false);
      if (completed) onChanged();
    }
  }

  function optionField(field: OptionField | undefined, type: "size" | "colour", value: string, onChange: (value: string) => void) {
    if (!field) return <input className={ui.optionInput} aria-label={"Add " + type} disabled placeholder={"No " + type + " rule configured"} />;
    if (field.type === "enum") return <select className={ui.optionInput} aria-label={"Choose " + type} value={value} onChange={(event) => onChange(event.target.value)} disabled={!editable}>
      <option value="">Choose {type}</option>
      {(field.allowedValues ?? []).map((entry) => <option value={entry} key={entry}>{readable(entry)}</option>)}
    </select>;
    return <input className={ui.optionInput} aria-label={"Add " + type} maxLength={128} value={value} onChange={(event) => onChange(event.target.value)} placeholder={"Add " + type} disabled={!editable} />;
  }

  return <div className={ui.matrix}>
    <div className={ui.matrixHeading}><div><h2 id="variants-heading">Sizes &amp; colours</h2><p>Add each size and colour once. Every combination becomes a SKU; remove combinations you do not make.</p></div><span>{total} SKU{total === 1 ? "" : "s"}</span></div>
    {!supportsMatrix && <div className={styles.error} role="alert">The published category schema has no usable size and colour variant fields. A platform taxonomy admin must publish those fields before size/colour SKUs can be created. You can still use Advanced SKU options below for other supported variant fields.</div>}
    {supportsMatrix && <>
      <div className={ui.optionGroups}>
        {(["size","colour"] as const).map((kind) => {
          const values = kind === "size" ? sizes : colours;
          const update = kind === "size" ? setSizes : setColours;
          return <div className={ui.optionGroup} key={kind}>
            <label>{kind === "size" ? "Sizes" : "Colours"}</label>
            <p>{kind === "size" ? "For example S, M, L, XL or Free size, where supported by this category." : "Use a colour name shoppers will recognise."}</p>
            <div className={ui.chips}>{values.map((value) => <span key={value} className={ui.chip}>{readable(value)}{editable && <button type="button" aria-label={"Remove " + kind + " " + value + " from selection"} onClick={() => update((all) => all.filter((entry) => entry !== value))}>×</button>}</span>)}</div>
            {editable && <form className={ui.optionForm} onSubmit={(event) => addOption(event, kind)}>
              {optionField(kind === "size" ? sizeField : colourField, kind, kind === "size" ? sizeInput : colourInput, kind === "size" ? setSizeInput : setColourInput)}
              <button type="submit" className={ui.optionAdd}>Add</button>
            </form>}
          </div>;
        })}
      </div>
      <div className={ui.matrixTableWrap}><table className={ui.matrixTable}>
        <caption className={styles.visuallyHidden}>Size and colour product SKU matrix</caption>
        <thead><tr><th>Variant</th><th>SKU code</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {saved.map((variant) => <tr key={variant.id}><th scope="row">{readable(variant.options[colourField?.code ?? "color"] ?? "Option")} · {variant.options[sizeField?.code ?? "size"] ?? "Size"}</th><td className={ui.skuCode}>{variant.sku}</td><td><span className={ui.savedTag}>Saved</span></td><td><span className={ui.muted}>Use Advanced options to edit or deactivate</span></td></tr>)}
          {candidateRows.filter((row) => !hasVariantCombination(row.options, product.variants)).map((row) => <tr key={row.key}>
            <th scope="row">{readable(row.colour)} · {row.size}</th>
            <td><input className={ui.skuInput} aria-label={"SKU code for " + row.colour + " " + row.size} value={row.sku} maxLength={40} disabled={!editable || busy || excluded.includes(row.key)} onChange={(event) => setSkuOverrides((previous) => ({ ...previous, [row.key]: event.target.value.toUpperCase() }))} /></td>
            <td><span className={ui.pendingTag}>{excluded.includes(row.key) ? "Skipped" : "New"}</span></td>
            <td><button className={ui.linkAction} type="button" disabled={!editable || busy} onClick={() => setExcluded((all) => all.includes(row.key) ? all.filter((key) => key !== row.key) : [...all, row.key])}>{excluded.includes(row.key) ? "Include" : "Skip"}</button></td>
          </tr>)}
          {!saved.length && !candidateRows.length && <tr><td colSpan={4}>Add at least one size and one colour to create SKUs.</td></tr>}
        </tbody>
      </table></div>
      <p className={ui.matrixFootnote}>Stock is managed in Inventory. SKU changes are stored on this draft; removing existing SKUs requires explicit deactivation so their history remains available.</p>
      {error && <div role="alert" className={styles.error}>{error}</div>}
      {notice && <div role="status" className={styles.notice}>{notice}</div>}
      {editable && <div className={ui.matrixActions}><span>{pending.length} unsaved combination{pending.length === 1 ? "" : "s"}</span><button type="button" disabled={busy || pending.length === 0} className={styles.primaryButton} onClick={() => void saveMatrix()}>{busy ? "Saving SKUs…" : "Create " + pending.length + " SKU" + (pending.length === 1 ? "" : "s")}</button></div>}
    </>}
  </div>;
}
