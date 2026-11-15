"use client";

import { useEffect, useState } from "react";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./product-workspace.module.css";

type AccessGrant = { roleCode: string; permissionCode: string };
type AccessSummary = { brandName?: string; brandState?: string; membershipState?: string; permissions?: AccessGrant[] };
type TeamMember = { userId: string; memberName?: string; membershipState: string; permissions: AccessGrant[] };

export function BrandAccessPanel({ brandId }: { brandId: string }) {
  const [summary, setSummary] = useState<AccessSummary | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [error, setError] = useState("");
  const [teamError, setTeamError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      w2Request<AccessSummary>(["brands", brandId, "access"]),
      w2Request<{ items: TeamMember[] }>(["brands", brandId, "access", "team"]),
    ]).then(([summaryResult, teamResult]) => {
      if (!active) return;
      if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
      else setError(summaryResult.reason instanceof W2ApiError ? summaryResult.reason.message : "Brand access could not be loaded.");
      if (teamResult.status === "fulfilled") setTeam(teamResult.value.items);
      else setTeamError(teamResult.reason instanceof W2ApiError ? teamResult.reason.message : "Team permissions are unavailable for this membership.");
    });
    return () => { active = false; };
  }, [brandId]);

  return <section className={styles.formPanel} aria-labelledby="brand-access-heading">
    <div className={styles.formHeading}><div><p className={styles.kicker}>ACCESS AND MEMBERSHIP</p><h2 id="brand-access-heading">Brand permissions</h2><p>Membership and permissions are resolved by the backend. This view never grants access.</p></div>{summary && <span className={styles.draftBadge}>{summary.membershipState ?? "UNKNOWN"}</span>}</div>
    {error ? <p className={styles.error} role="alert">{error}</p> : summary && <>
      <div className={styles.schemaPanel}><div><p className={styles.kicker}>YOUR MEMBERSHIP</p><h3>{summary.brandName ?? brandId}</h3><p>{summary.brandState ?? "Brand state unavailable"} · {summary.membershipState ?? "Membership unavailable"}</p></div><ul className={styles.attributeList}>{(summary.permissions ?? []).map((permission) => <li key={`${permission.roleCode}-${permission.permissionCode}`}><span>{permission.permissionCode}</span><small>{permission.roleCode}</small></li>)}</ul></div>
      {teamError ? <p className={styles.readOnlyNotice} role="status">{teamError}</p> : <div className={styles.tableWrap}><table className={styles.variantTable}><caption>Redacted team permission view</caption><thead><tr><th>Member</th><th>State</th><th>Roles and permissions</th></tr></thead><tbody>{team.length === 0 ? <tr><td colSpan={3}>No team members are persisted for this brand.</td></tr> : team.map((member) => <tr key={member.userId}><th>{member.memberName ?? "Member"}</th><td>{member.membershipState}</td><td>{member.permissions.length ? member.permissions.map((permission) => `${permission.roleCode}: ${permission.permissionCode}`).join(" · ") : "No active permission grant"}</td></tr>)}</tbody></table></div>}
    </>}
  </section>;
}
