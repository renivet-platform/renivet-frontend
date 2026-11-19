"use client";

import { useEffect, useState } from "react";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./team-prototype.module.css";

type Grant = { roleCode: string; permissionCode: string };
type TeamMember = {
  userId: string; memberName?: string | null; memberEmail?: string | null;
  membershipState: string; validUntil?: string | null; permissions: Grant[];
};
type AccessSummary = { brandName?: string; membershipState?: string; permissions?: Grant[] };

const roleDetails = [
  { codes: ["brand_owner"], label: "Owner", detail: "Brand management, team access and the permitted product workflows." },
  { codes: ["catalogue_editor", "catalog_editor"], label: "Catalogue editor", detail: "Products, photos, prices as proposals, claims and imports." },
  { codes: ["stock_manager"], label: "Stock manager", detail: "Inventory records, counts and quarantine, subject to approval." },
  { codes: ["brand_staff"], label: "Brand staff", detail: "Limited brand access granted by Renivet." },
];
const visibleRole = (code: string) => roleDetails.find(entry => entry.codes.includes(code))?.label ?? code.replaceAll("_"," ").replace(/\b\w/g, m => m.toUpperCase());
function rolesFor(member: TeamMember) {
  const codes = [...new Set(member.permissions.map(grant => grant.roleCode))];
  return codes.length ? codes.map(visibleRole).join(", ") : "Not assigned";
}
function stateLabel(state: string) {
  return state === "active" ? "Active" : state === "invited" ? "Invite sent" : state === "revoked" ? "Access removed" : state === "suspended" ? "Suspended" : state === "pending" ? "Pending" : "Unavailable";
}

export function BrandTeam({ brandId }: { brandId: string }) {
  const [summary, setSummary] = useState<AccessSummary | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const [access, members] = await Promise.allSettled([
      w2Request<AccessSummary>(["brands", brandId, "access"]),
      w2Request<{ items: TeamMember[] }>(["brands", brandId, "access", "team"]),
    ]);
    if (access.status === "fulfilled") setSummary(access.value);
    else { setSummary(null); setError(access.reason instanceof W2ApiError ? access.reason.message : "Brand access is unavailable."); }
    if (members.status === "fulfilled") setTeam(members.value.items);
    else { setTeam([]); setError(members.reason instanceof W2ApiError ? members.reason.message : "The team could not be loaded."); }
    setLoading(false);
  }
  useEffect(() => { void load(); }, [brandId]);

  return <main className={styles.page} data-screen-id="SE-20C" aria-labelledby="team-title">
    <header className={styles.heading}>
      <div><h1 id="team-title">Team &amp; access</h1>
        <p>Who can work on {summary?.brandName ?? "your brand"}, and what they can do.</p></div>
      <button type="button" disabled className={styles.invite} title="Invite and acceptance backend workflow is pending">Invite someone</button>
    </header>
    {error && <section className={styles.error} role="alert"><strong>Unable to load team</strong><p>{error}</p><button type="button" onClick={() => void load()}>Retry</button></section>}
    <div className={styles.columns}>
      <section className={styles.teamCard} aria-label="Team members">
        <div className={styles.tableWrap}>
          <table>
            <caption className={styles.srOnly}>Team members and access for the selected brand</caption>
            <thead><tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"><span className={styles.srOnly}>Action</span></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4} className={styles.empty} role="status">Loading team members…</td></tr>}
              {!loading && !error && team.length === 0 && <tr><td colSpan={4} className={styles.empty}>No team members were returned for this brand.</td></tr>}
              {!loading && !error && team.map(member => {
                const roles=rolesFor(member);
                const onlyOwner=member.membershipState==="active" && member.permissions.some(x=>x.roleCode==="brand_owner") &&
                  team.filter(m=>m.membershipState==="active" && m.permissions.some(x=>x.roleCode==="brand_owner")).length === 1;
                return <tr key={member.userId}>
                  <th scope="row" data-label="Person"><strong>{member.memberName || member.memberEmail || "Member"}</strong>
                    {member.memberEmail && <small>{member.memberEmail}</small>}</th>
                  <td data-label="Role">{roles}</td>
                  <td data-label="Status"><span className={`${styles.status} ${member.membershipState==="active"?styles.active:member.membershipState==="invited"?styles.invited:styles.inactive}`}>{stateLabel(member.membershipState)}</span>
                    {member.membershipState==="invited" && member.validUntil && <small>Expires {new Date(member.validUntil).toLocaleDateString("en-IN")}</small>}</td>
                  <td data-label="Action">{onlyOwner ? <span className={styles.note}>Only owner</span> : member.membershipState==="revoked" ? null : <button type="button" disabled className={styles.remove} title="Revoke/cancel API not yet available">{member.membershipState==="invited"?"Cancel invite":"Remove"}</button>}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>
      <aside className={styles.roles}><h2>Roles</h2><dl>{roleDetails.map(role=><div key={role.label}><dt>{role.label}</dt><dd>{role.detail}</dd></div>)}</dl>
        <p className={styles.disclosure}>Only server-authorized role grants take effect; no access can be granted by changing this page.</p>
      </aside>
    </div>
    <p className={styles.serviceNotice}>Invitations, revocations and role changes require the secured membership-management API. These actions remain disabled until they are persisted and audited. Existing team records and statuses above are read from NestJS.</p>
  </main>;
}
