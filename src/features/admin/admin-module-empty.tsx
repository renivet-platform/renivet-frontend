import Link from "next/link";
import styles from "./admin-module-empty.module.css";

type AdminModuleId = "AD-05" | "AD-06" | "AD-09" | "AD-19" | "AD-20";
type AdminModuleKind = "bank" | "staff" | "exceptions" | "privacy" | "audit";

const modules: Record<AdminModuleKind, {
  id: AdminModuleId;
  title: string;
  description: string;
  noticeTitle: string;
  notice: string;
  tableTitle: string;
  columns: string[];
  empty: string;
  footnote: string;
}> = {
  bank: {
    id: "AD-05",
    title: "Bank verification",
    description: "Match a payout account to the business before any payout can use it.",
    noticeTitle: "Bank evidence service unavailable",
    notice: "The bank evidence and independent verification API is not registered. No account details, proof files, or verification decisions are available on this screen.",
    tableTitle: "Accounts awaiting verification",
    columns: ["Brand", "Change", "Masked account", "Evidence", "Submitted"],
    empty: "No bank records are loaded. This is an unavailable service state, not a verified or empty bank queue.",
    footnote: "Do not mark an account verified until a finance reviewer has checked evidence through an approved service.",
  },
  staff: {
    id: "AD-06",
    title: "Staff and access",
    description: "Review platform roles and access changes with least privilege and independent approval.",
    noticeTitle: "Staff access service unavailable",
    notice: "No approved staff grant, revocation, role catalog, or second-admin approval API is connected. This screen cannot change anyone’s access.",
    tableTitle: "Staff access requests",
    columns: ["Person", "Requested access", "Requested by", "Status"],
    empty: "No staff records or access requests are loaded.",
    footnote: "Role names and assignments must come from the server. Changes require the approved maker-checker flow.",
  },
  exceptions: {
    id: "AD-09",
    title: "Inventory exceptions",
    description: "Investigate stock discrepancies using the inventory service as the source of truth.",
    noticeTitle: "Inventory exception queue unavailable",
    notice: "The inventory exception queue is not registered, and inventory remains behind its release gate. No stock counts or exception records are shown.",
    tableTitle: "Open inventory exceptions",
    columns: ["Brand", "SKU", "Exception", "Last observed", "Status"],
    empty: "No inventory records are loaded. This screen does not imply that stock is clear.",
    footnote: "Inventory changes must be made by the authorized inventory service, never from a browser-side admin override.",
  },
  privacy: {
    id: "AD-19",
    title: "Privacy requests",
    description: "Handle customer access, correction, and deletion requests under approved legal rules.",
    noticeTitle: "Privacy request service unavailable",
    notice: "The admin request API, retention rules, and legal hold workflow are not connected. No customer request or deadline is displayed.",
    tableTitle: "Customer data requests",
    columns: ["Request", "Customer", "Status", "Due date"],
    empty: "No privacy request records are loaded. Do not treat this as confirmation that no requests are pending.",
    footnote: "Customer identity, legal holds, retention, and completion must be confirmed by the approved privacy service.",
  },
  audit: {
    id: "AD-20",
    title: "Audit log",
    description: "Read a reliable history of decisions and changes, including who acted and why.",
    noticeTitle: "Audit history is not connected",
    notice: "There is no scoped audit-read API registered. Events, actors, timestamps, and reasons are not available here.",
    tableTitle: "Recorded activity",
    columns: ["When", "Who", "What changed", "Reason"],
    empty: "No audit events are loaded. This screen must not be used as evidence that an action did or did not occur.",
    footnote: "Audit history is read-only and must be sourced from the immutable server-side event record.",
  },
};

const previewFilters: Record<AdminModuleKind, readonly string[]> = {
  bank: ["Awaiting review","Changes pending","Verification history"],
  staff: ["Pending grants","Active access","Revocations"],
  exceptions: ["Open","Investigating","Resolved"],
  privacy: ["Data copies","Account deletion","Requests on hold"],
  audit: ["Permission changes","Decisions","Session activity"],
};

export function AdminModuleEmptyScreen({ kind }: { kind: AdminModuleKind }) {
  const item = modules[kind];
  return <main className={styles.page} data-screen-id={item.id} aria-labelledby="admin-module-title">
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>RENIVET OPERATIONS <span aria-hidden="true">/</span> {item.id}</p><h1 id="admin-module-title">{item.title}</h1><p>{item.description}</p></div>
      {kind === "bank" && <Link className={styles.secondaryAction} href="/brand-approvals">Brand applications</Link>}
    </header>

    <section className={styles.connectionNotice} aria-labelledby="connection-title">
      <span className={styles.statusMark} aria-hidden="true">!</span>
      <div><h2 id="connection-title">{item.noticeTitle}</h2><p>{item.notice}</p></div>
      <span className={styles.statusBadge}>Not connected</span>
    </section>

    <section className={styles.filterPanel} aria-labelledby="filter-title">
      <div><h2 id="filter-title">{kind === "audit" ? "Audit filters" : "Queue filters"}</h2>
        <p>Filtering becomes available only when the authorized {kind === "audit" ? "immutable event" : kind === "bank" ? "bank-evidence" : kind === "staff" ? "staff-access" : kind === "exceptions" ? "inventory-exception" : "privacy-request"} service provides records.</p></div>
      <fieldset disabled className={styles.disabledFilters} aria-label="Unavailable filters">
        <label>Search records<input type="search" placeholder="Search server records" /></label>
        <label>View<select defaultValue=""><option value="">Choose a filter</option>{previewFilters[kind].map(option=><option key={option}>{option}</option>)}</select></label>
      </fieldset>
    </section>

<div className={kind === "bank" ? styles.bankColumns : undefined}>
    <section className={styles.moduleCard} aria-labelledby="records-title">
      <div className={styles.cardHeader}><div><p className={styles.eyebrow}>PLATFORM WORKSPACE</p><h2 id="records-title">{item.tableTitle}</h2></div><span className={styles.readonly}>Server data only</span></div>
      {kind === "bank"
        ? <div className={styles.bankUnloaded} role="status">
            <dl>
              <div><dt>Account holder</dt><dd>Not available</dd></div>
              <div><dt>Legal business name</dt><dd>Not available</dd></div>
              <div><dt>Masked account</dt><dd>Not available</dd></div>
              <div><dt>Submitted</dt><dd>Not available</dd></div>
            </dl>
            <p>Private bank proof cannot be inspected until the finance evidence service is connected. No names or account digits are inferred from this design preview.</p>
            <button type="button" disabled>Open bank proof — unavailable</button>
          </div>
        : <div className={styles.tableWrap}>
            <table>
              <thead><tr>{item.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
              <tbody><tr><td colSpan={item.columns.length}><div className={styles.emptyState} role="status"><span className={styles.emptyIcon} aria-hidden="true">—</span><strong>Records are unavailable</strong><p>{item.empty}</p></div></td></tr></tbody>
            </table>
          </div>}
    </section>

    {kind === "bank" && <section className={styles.decisionPreview} aria-labelledby="bank-decision-title">
      <h2 id="bank-decision-title">Your decision</h2>
      <p>Open a real account review to inspect masked details, signed bank proof and the independent checker before choosing an outcome.</p>
      <fieldset disabled><legend>Decision actions unavailable</legend>
        <label><input type="radio" name="bank-decision" /> Verify account</label>
        <label><input type="radio" name="bank-decision" /> Ask for different proof</label>
        <label><input type="radio" name="bank-decision" /> Reject account</label>
        <label>Reason <select defaultValue=""><option value="">Select reason</option></select></label>
        <label>Reviewer note <textarea rows={2} placeholder="A note must be persisted with the decision." /></label>
        <button type="button" disabled>Record decision unavailable</button>
      </fieldset>
    </section>}
    </div>
    {kind === "exceptions" && <section className={styles.policyCard} aria-labelledby="exception-rules">
      <h2 id="exception-rules">Investigating a stock exception</h2>
      <p>Open exceptions will require the affected variant, location, counted/expected stock and journal evidence. This page cannot edit allocations or override available-to-sell without the inventory service.</p>
    </section>}
    {kind === "privacy" && <section className={styles.policyCard} aria-labelledby="privacy-rules">
      <h2 id="privacy-rules">Processing a customer data request</h2>
      <p>Verify the customer's identity, approved retention/hold rules, and the request version before any data is exported or an account is deleted. Completion cannot be recorded until the audit-backed privacy service is available.</p>
    </section>}
        {kind === "staff" && <section className={styles.policyCard}><p className={styles.eyebrow}>ACCESS POLICY</p><h2>Role details are not loaded</h2><p>Server-managed roles and permission descriptions will appear when the reviewed access catalog is connected. No role grants are offered here.</p></section>}
    {kind === "bank" && <section className={styles.policyCard}><p className={styles.eyebrow}>FINANCE CONTROL</p><h2>Independent review required</h2><p>{item.footnote}</p></section>}
    {kind === "audit" && <section className={styles.policyCard}><p className={styles.eyebrow}>READ ONLY</p><h2>Integrity of the event record</h2><p>{item.footnote}</p></section>}
    
    
  </main>;
}
