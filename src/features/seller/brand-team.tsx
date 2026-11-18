"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./brand-workspace.module.css";

type AccessGrant = { roleCode: string; permissionCode: string };
type TeamMember = { userId: string; memberName?: string; membershipState: string; permissions: AccessGrant[] };
type AccessSummary = { brandName?: string; brandState?: string; membershipState?: string; permissions?: AccessGrant[] };

export function BrandTeam({ brandId }: { brandId: string }) {
  const [summary, setSummary] = useState<AccessSummary | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [error, setError] = useState("");
  const load = async () => { setError(""); const [summaryResult, teamResult] = await Promise.allSettled([w2Request<AccessSummary>(["brands", brandId, "access"]), w2Request<{ items: TeamMember[] }>(["brands", brandId, "access", "team"])]); if (summaryResult.status === "fulfilled") setSummary(summaryResult.value); else setError(summaryResult.reason instanceof W2ApiError ? summaryResult.reason.message : "Brand access is unavailable."); if (teamResult.status === "fulfilled") setTeam(teamResult.value.items); else setError(teamResult.reason instanceof W2ApiError ? teamResult.reason.message : "The team permission view is unavailable."); };
  useEffect(() => { void load(); }, [brandId]);
  const brandPath = `/brands/${encodeURIComponent(brandId)}`;
  return <main className={styles.page} aria-labelledby="team-title" data-screen-id="SE-20C"><div className={styles.shell}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href={`${brandPath}/workspace`}>Workspace</Link><span aria-hidden="true">/</span><span>Team &amp; permissions</span></nav>
    <header className={styles.header}><div><p className={styles.kicker}>ACCESS AND MEMBERSHIP</p><h1 id="team-title">Team &amp; permissions</h1><p className={styles.subtitle}>Redacted membership information is read from the backend. This view never grants access.</p></div><span className={styles.state}>{summary?.membershipState ?? "Loading access"}</span></header>
    {error && <div className={styles.error} role="alert"><strong>Team access unavailable</strong><div>{error}</div><button className={styles.button} type="button" onClick={() => void load()}>Try again</button></div>}
    {summary && <section className={styles.hero}><strong>{summary.brandName ?? brandId}</strong><p>{summary.brandState ?? "Brand state not reported"} · {summary.membershipState ?? "Membership state not reported"}</p><div className={styles.actions}>{(summary.permissions ?? []).map((permission) => <span className={styles.tag} key={`${permission.roleCode}-${permission.permissionCode}`}>{permission.permissionCode}</span>)}</div></section>}
    <h2 className={styles.sectionTitle}>Persisted team members</h2><div className={styles.tableWrap}><table className={styles.table}><caption className="sr-only">Redacted team permission view</caption><thead><tr><th>Member</th><th>State</th><th>Roles and permissions</th></tr></thead><tbody>{team.length === 0 ? <tr><td colSpan={3} className={styles.muted}>No persisted team members are available for this brand.</td></tr> : team.map((member) => <tr key={member.userId}><td><strong>{member.memberName ?? "Member"}</strong><div className={styles.muted}>User ID redacted</div></td><td><span className={styles.tag}>{member.membershipState}</span></td><td>{member.permissions.length ? member.permissions.map((permission) => `${permission.roleCode}: ${permission.permissionCode}`).join(" · ") : "No active permission grant"}</td></tr>)}</tbody></table></div>
    <p className={styles.footerNote}>Invite, revoke, and role-assignment actions remain controlled by the backend and are intentionally not fabricated in this read-only view.</p>
  </div></main>;
}
