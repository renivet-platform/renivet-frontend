"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentSession } from "@/features/identity/auth-api";
import { createIdempotencyKey, W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./product-workspace.module.css";
import visual from "./import-inventory-prototype.module.css";

type Balance = { brandId: string; variantId: string; locationId: string; physical: number; allocatedNotDispatched: number; availableToSell: number; version: number };
type Movement = { id: string; variantId: string; locationId: string; deltaPhysical: number; reason: string; recordedAt: string };
type Reconciliation = { id: string; variantId: string; locationId: string; version: number; status: string; reasonCode?: string };

function errorMessage(error: unknown) {
  if (error instanceof W2ApiError) {
    if (error.status === 404) return "The inventory ledger API is not active in this environment. In disposable local development, the backend requires RENIVET_INVENTORY_API_ENABLED=true after the reviewed stock migrations. It remains gated in shared environments until the security and inventory acceptance checks are approved.";
    if (error.status === 403) return "This account does not have permission to view inventory for the selected brand.";
    if (error.status === 401) return "Your session has expired. Sign in again and reopen the brand workspace.";
    if (error.status >= 500) return "The inventory ledger is temporarily unavailable. No stock has been changed.";
    return error.message;
  }
  return "Inventory could not be loaded. Try again shortly.";
}

export function InventoryAvailability({ brandId }: { brandId: string }) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [locationName, setLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState({ variantId: "", locationId: "", quantity: "", reason: "", sourceReference: "", expectedVersion: "", delta: "", physical: "" });
  const [savingAction, setSavingAction] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const [balanceResult, movementResult, reconciliationResult] = await Promise.all([
        w2Request<{ items: Balance[] }>(["brands", brandId, "inventory", "balances"]),
        w2Request<{ items: Movement[] }>(["brands", brandId, "inventory", "movements"]),
        w2Request<{ items: Reconciliation[] }>(["brands", brandId, "inventory", "reconciliations"]),
      ]);
      setBalances(balanceResult.items); setMovements(movementResult.items); setReconciliations(reconciliationResult.items);
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [brandId]);

  async function createLocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSavingLocation(true); setError(""); setNotice("");
    try {
      const session = await getCurrentSession();
      await w2Request(["brands", brandId, "inventory", "locations"], { method: "POST", body: { code: locationCode.trim(), name: locationName.trim() }, csrfToken: session.csrfToken, idempotencyKey: createIdempotencyKey() });
      setLocationCode(""); setLocationName(""); setNotice("Location created. Balances appear after the backend records stock for a product and location."); await load();
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setSavingLocation(false); }
  }

  async function submitAction(event: React.FormEvent<HTMLFormElement>, kind: "receipt" | "observation" | "adjustment" | "count" | "transfer" | "return" | "resolve") {
    event.preventDefault(); setSavingAction(true); setError(""); setNotice("");
    try {
      const session = await getCurrentSession();
      const key = createIdempotencyKey();
      const base = { variantId: action.variantId.trim(), locationId: action.locationId.trim() };
      if (kind === "receipt") await w2Request(["brands", brandId, "inventory", "opening-receipts"], { method: "POST", body: { ...base, quantity: Number(action.quantity), unit: "EACH", sourceType: "MANUAL", sourceReference: action.sourceReference.trim() }, csrfToken: session.csrfToken, idempotencyKey: key });
      if (kind === "observation") await w2Request(["brands", brandId, "inventory", "observations"], { method: "POST", body: { ...base, sourceNamespace: "brand-console", sourceReference: action.sourceReference.trim(), asOf: new Date().toISOString(), meaning: "PHYSICAL_COUNT", quantity: Number(action.quantity) }, csrfToken: session.csrfToken, idempotencyKey: key });
      if (kind === "adjustment") await w2Request(["brands", brandId, "inventory", "adjustments"], { method: "POST", body: { ...base, delta: Number(action.delta), reason: action.reason.trim() }, csrfToken: session.csrfToken, idempotencyKey: key, ifMatch: action.expectedVersion.trim() });
      if (kind === "count") await w2Request(["brands", brandId, "inventory", "cycle-counts"], { method: "POST", body: { ...base, physical: Number(action.physical), expectedVersion: Number(action.expectedVersion) }, csrfToken: session.csrfToken, idempotencyKey: key });
      if (kind === "transfer") await w2Request(["brands", brandId, "inventory", "transfers"], { method: "POST", body: { variantId: action.variantId.trim(), fromLocationId: action.locationId.trim(), toLocationId: action.sourceReference.trim(), quantity: Number(action.quantity), reason: action.reason.trim() }, csrfToken: session.csrfToken, idempotencyKey: key, ifMatch: action.expectedVersion.trim() });
      if (kind === "return") await w2Request(["brands", brandId, "inventory", "returns"], { method: "POST", body: { ...base, quantity: Number(action.quantity), condition: "INSPECT", reason: action.reason.trim(), evidenceReference: action.sourceReference.trim() || null }, csrfToken: session.csrfToken, idempotencyKey: key });
      if (kind === "resolve") await w2Request(["brands", brandId, "inventory", "reconciliations", action.sourceReference.trim(), "resolve"], { method: "POST", body: { decision: "DISMISS", expectedCaseVersion: Number(action.expectedVersion), reasonCode: action.reason.trim() }, csrfToken: session.csrfToken, idempotencyKey: key, ifMatch: action.expectedVersion.trim() });
      setNotice("Request accepted by the backend. Refreshing authoritative inventory…"); await load();
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setSavingAction(false); }
  }

  // These totals summarize precisely the balances returned by the API.
  // A partial/failed backend read must never be presented as zero inventory.
  const balanceTotals = balances.reduce((totals, row) => ({
    physical: totals.physical + row.physical,
    allocated: totals.allocated + row.allocatedNotDispatched,
    available: totals.available + row.availableToSell,
  }), {physical:0,allocated:0,available:0});
  const openCases = reconciliations.filter(row => ["OPEN","PENDING_REVIEW","INVESTIGATING"].includes(row.status.toUpperCase())).length;

  return <main className={styles.page} aria-labelledby="inventory-title" data-screen-id="SE-13">
    <nav className={styles.detailBreadcrumb} aria-label="Breadcrumb"><Link href={`/brands/${encodeURIComponent(brandId)}/products`}>Products</Link><span aria-hidden="true">/</span><span>Inventory</span></nav>
    <header className={styles.header}><div><p className={styles.kicker}>BRAND WORKSPACE <span aria-hidden="true">/</span> STOCK</p><h1 id="inventory-title">Inventory</h1><p className={styles.subtitle}>Physical stock, allocations and available-to-sell balances come from Renivet’s backend stock ledger. Nothing here uses imported spreadsheet quantities as stock.</p></div><span className={styles.draftBadge}>LIVE BACKEND DATA</span></header>
    <section className={visual.stockRule} aria-label="Stock availability calculation">
      <strong>What is available to sell?</strong>
      <p>Physical − quarantined − unsellable − allocated (not dispatched) − buffer. The backend is authoritative; no stock is reserved before payment, and a shortage must pause selling.</p>
    </section>
    {error && <div className={styles.errorPanel} role="alert"><strong>Inventory unavailable</strong><p>{error}</p><button type="button" className={styles.secondaryButton} onClick={() => void load()}>Retry</button></div>}
    {loading ? <p className={styles.stateMessage} role="status">Loading backend inventory…</p> : !error && <>
      <section className={visual.stockStats} aria-label="Backend-reported stock summary" aria-live="polite">
        <article><strong>{balances.length}</strong><span>Balance records loaded</span></article>
        <article><strong>{balanceTotals.physical}</strong><span>Physical units in loaded records</span></article>
        <article><strong>{balanceTotals.available}</strong><span>Available to sell in loaded records</span></article>
        <article><strong>{openCases}</strong><span>Open reconciliation cases returned</span></article>
      </section>
      <p className={visual.summaryWarning}>These are sums of the returned backend records, not a guarantee of complete warehouse coverage. Quarantined, unsellable and buffer balances are already reflected in the server-calculated availability; no missing quantities are inferred by this UI.</p>
      <section className={styles.formPanel} aria-labelledby="balances-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>AVAILABLE TO SELL</p><h2 id="balances-heading">Stock balances</h2><p>Quantities are calculated by the inventory service. No browser-side stock values are invented.</p></div><button type="button" className={styles.secondaryButton} onClick={() => void load()}>Refresh</button></div>{balances.length === 0 ? <p className={styles.emptyLine}>No persisted stock balances are available for this brand.</p> : <div className={styles.tableWrap}><table className={styles.variantTable}><caption className={styles.visuallyHidden}>Authoritative stock balances</caption><thead><tr><th>Variant</th><th>Location</th><th>Physical</th><th>Allocated</th><th>Available to sell</th><th>Version</th></tr></thead><tbody>{balances.map((balance) => <tr key={`${balance.variantId}-${balance.locationId}`}><th>{balance.variantId}</th><td>{balance.locationId}</td><td>{balance.physical}</td><td>{balance.allocatedNotDispatched}</td><td>{balance.availableToSell}</td><td>{balance.version}</td></tr>)}</tbody></table></div>}</section>
      <section className={styles.formPanel} aria-labelledby="location-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>LOCATIONS</p><h2 id="location-heading">Add a stock location</h2><p>Creating a location is persisted by the backend and requires the brand’s inventory permission.</p></div></div><form onSubmit={createLocation} noValidate><div className={styles.formGrid}><div className={styles.field}><label htmlFor="location-code">Location code</label><input id="location-code" value={locationCode} onChange={(event) => setLocationCode(event.target.value)} required maxLength={64} /></div><div className={styles.field}><label htmlFor="location-name">Location name</label><input id="location-name" value={locationName} onChange={(event) => setLocationName(event.target.value)} required maxLength={256} /></div></div>{notice && <p className={styles.notice} role="status">{notice}</p>}<div className={styles.formActions}><p>Inventory changes are audited by the backend.</p><button type="submit" className={styles.primaryButton} disabled={savingLocation || !locationCode.trim() || !locationName.trim()}>{savingLocation ? "Saving…" : "Create location"}</button></div></form></section>
      <section className={styles.formPanel} aria-labelledby="movement-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>MOVEMENT HISTORY</p><h2 id="movement-heading">Recent stock movements</h2><p>Every movement is immutable and tenant-scoped.</p></div></div>{movements.length === 0 ? <p className={styles.emptyLine}>No persisted movement records are available for this brand.</p> : <div className={styles.tableWrap}><table className={styles.variantTable}><caption className={styles.visuallyHidden}>Recent stock movements</caption><thead><tr><th>Variant</th><th>Location</th><th>Delta</th><th>Reason</th><th>Recorded</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><th>{movement.variantId}</th><td>{movement.locationId}</td><td>{movement.deltaPhysical}</td><td>{movement.reason}</td><td>{new Date(movement.recordedAt).toLocaleString()}</td></tr>)}</tbody></table></div>}</section>
      <section className={styles.formPanel} aria-labelledby="actions-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>CONTROLLED STOCK ACTIONS</p><h2 id="actions-heading">Record inventory evidence</h2><p>These forms call the protected ledger APIs. Permissions, CSRF, idempotency, and version checks remain server-enforced.</p></div></div><div className={styles.formGrid}><div className={styles.field}><label htmlFor="inventory-variant">Variant ID</label><input id="inventory-variant" value={action.variantId} onChange={(e) => setAction({ ...action, variantId: e.target.value })} /></div><div className={styles.field}><label htmlFor="inventory-location">Location ID</label><input id="inventory-location" value={action.locationId} onChange={(e) => setAction({ ...action, locationId: e.target.value })} /></div><div className={styles.field}><label htmlFor="inventory-quantity">Quantity</label><input id="inventory-quantity" type="number" min="0" value={action.quantity} onChange={(e) => setAction({ ...action, quantity: e.target.value })} /></div><div className={styles.field}><label htmlFor="inventory-reference">Source reference</label><input id="inventory-reference" value={action.sourceReference} onChange={(e) => setAction({ ...action, sourceReference: e.target.value })} /></div><div className={styles.field}><label htmlFor="inventory-delta">Adjustment delta</label><input id="inventory-delta" type="number" value={action.delta} onChange={(e) => setAction({ ...action, delta: e.target.value })} /></div><div className={styles.field}><label htmlFor="inventory-version">Expected version / If-Match</label><input id="inventory-version" value={action.expectedVersion} onChange={(e) => setAction({ ...action, expectedVersion: e.target.value })} /><small>Use the balance version for adjustments, or the case version for reconciliation.</small></div><div className={styles.field}><label htmlFor="inventory-physical">Counted physical quantity</label><input id="inventory-physical" type="number" min="0" value={action.physical} onChange={(e) => setAction({ ...action, physical: e.target.value })} /></div><div className={styles.field}><label htmlFor="inventory-reason">Reason</label><input id="inventory-reason" value={action.reason} onChange={(e) => setAction({ ...action, reason: e.target.value })} /></div></div>{notice && <p className={styles.notice} role="status">{notice}</p>}<div className={styles.formActions}><form onSubmit={(e) => void submitAction(e, "receipt")}><button className={styles.secondaryButton} disabled={savingAction}>Record opening receipt</button></form><form onSubmit={(e) => void submitAction(e, "observation")}><button className={styles.secondaryButton} disabled={savingAction}>Submit observation</button></form><form onSubmit={(e) => void submitAction(e, "adjustment")}><button className={styles.secondaryButton} disabled={savingAction}>Propose adjustment</button></form><form onSubmit={(e) => void submitAction(e, "count")}><button className={styles.secondaryButton} disabled={savingAction}>Submit cycle count</button></form></div></section>
      <section className={styles.formPanel} aria-labelledby="workflow-heading"><div className={styles.formHeading}><div><p className={styles.kicker}>STOCK WORKFLOWS</p><h2 id="workflow-heading">Transfers, returns, and reconciliation</h2><p>Enter the persisted identifiers from the backend response. Failed or unauthorized requests stay visible and do not claim success.</p></div></div><div className={styles.formActions}><form onSubmit={(e) => void submitAction(e, "transfer")}><button className={styles.secondaryButton} disabled={savingAction}>Transfer to destination</button></form><form onSubmit={(e) => void submitAction(e, "return")}><button className={styles.secondaryButton} disabled={savingAction}>Submit return for inspection</button></form><form onSubmit={(e) => void submitAction(e, "resolve")}><button className={styles.secondaryButton} disabled={savingAction || !reconciliations.length}>Dismiss selected reconciliation</button></form></div>{reconciliations.length === 0 ? <p className={styles.emptyLine}>No persisted reconciliation cases are available.</p> : <div className={styles.tableWrap}><table className={styles.variantTable}><caption className={styles.visuallyHidden}>Inventory reconciliation cases</caption><thead><tr><th>Case</th><th>Variant</th><th>Location</th><th>Status</th><th>Version</th></tr></thead><tbody>{reconciliations.map((item) => <tr key={item.id}><th>{item.id}</th><td>{item.variantId}</td><td>{item.locationId}</td><td>{item.status}</td><td>{item.version}</td></tr>)}</tbody></table></div>}</section>
    </>}
  </main>;
}
