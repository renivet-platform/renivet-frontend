"use client";

import { useCallback, useEffect, useState } from "react";
import { createIdempotencyKey, W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import { getCurrentSession } from "@/features/identity/auth-api";
import styles from "./team-exact.module.css";

type Role = "brand_owner" | "catalogue_editor" | "stock_manager" | "brand_staff";
type TeamMember = { userId:string; memberName:string; email:string|null; membershipState:string; roles:Role[]; isSelf:boolean; canRemove:boolean };
type TeamInvite = { id:string; email:string; roleCode:Role; state:string; expiresAt:string };
type TeamResult = { items:TeamMember[]; invitations:TeamInvite[] };

const presetRoles: ReadonlyArray<{ id:Role; name:string; description:string }> = [
  {id:"brand_owner",name:"Owner",description:"Everything, including team, payout account and brand profile."},
  {id:"catalogue_editor",name:"Catalogue editor",description:"Products, photos, prices (as proposals), claims and imports."},
  {id:"stock_manager",name:"Stock manager",description:"Inventory only: record stock, counts and quarantine."},
];
const roleName = (id:string) => presetRoles.find(role=>role.id===id)?.name ?? (id==="brand_staff" ? "Staff" : "Assigned role");
const readableError = (error:unknown) => {
  if(error instanceof W2ApiError) {
    if(error.status===401) return "Your session has expired. Sign in again.";
    if(error.status===403) return "Only authorized brand owners can manage this team.";
    if(error.status===404) return "Team management needs the updated Renivet backend API.";
    return error.message;
  }
  return "The team service could not be reached. Try again.";
};

export function BrandTeam({brandId}:{brandId:string}) {
  const [data,setData]=useState<TeamResult>({items:[],invitations:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [inviteOpen,setInviteOpen]=useState(false);
  const [email,setEmail]=useState("");
  const [role,setRole]=useState<"catalogue_editor"|"stock_manager">("catalogue_editor");
  const [busy,setBusy]=useState(false);
  const [confirm,setConfirm]=useState<{kind:"remove"|"cancel";id:string;person:string}|null>(null);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const result=await w2Request<TeamResult>(["brands",brandId,"access","team-v2"]);
      setData(result);
    } catch(caught) { setError(readableError(caught)); }
    finally { setLoading(false); }
  },[brandId]);
  useEffect(()=>{void load();},[load]);

  const write=async(kind:"invite"|"remove"|"cancel",id?:string)=>{
    setBusy(true);setError("");setNotice("");
    try {
      const session=await getCurrentSession();
      const csrfToken=session.csrfToken;
      if(kind==="invite") {
        await w2Request(["brands",brandId,"access","invitations"],{method:"POST",body:{email:email.trim().toLowerCase(),roleCode:role},csrfToken,idempotencyKey:createIdempotencyKey()});
        setInviteOpen(false);setEmail("");setNotice("Invitation sent. The invitee can accept with the same verified email within seven days.");
      } else if(kind==="remove"&&id) {
        await w2Request(["brands",brandId,"access","team",id,"revoke"],{method:"POST",csrfToken,idempotencyKey:createIdempotencyKey()});
        setNotice("Team access removed. The person cannot use this brand's protected APIs.");
      } else if(kind==="cancel"&&id) {
        await w2Request(["brands",brandId,"access","invitations",id,"cancel"],{method:"POST",csrfToken,idempotencyKey:createIdempotencyKey()});
        setNotice("Invitation cancelled.");
      }
      setConfirm(null);await load();
    } catch(caught) {setError(readableError(caught));}
    finally{setBusy(false);}
  };

  return <main className={styles.page} data-screen-id="SE-20C" aria-labelledby="team-title">
    <header className={styles.header}>
      <div><h1 id="team-title">Team &amp; access</h1><p>Who can work on this brand, and what they can do.</p></div>
      <button className={styles.primary} type="button" onClick={()=>setInviteOpen(true)} disabled={busy||loading||Boolean(error)}>Invite someone</button>
    </header>
    {error&&<div className={styles.error} role="alert"><strong>Team access unavailable</strong><p>{error}</p><button type="button" onClick={()=>void load()}>Retry</button></div>}
    {notice&&<p className={styles.success} role="status">{notice}</p>}
    <div className={styles.columns}>
      <section className={styles.tablePanel} aria-labelledby="people-heading">
        <h2 id="people-heading" className={styles.srOnly}>Brand team members and invitations</h2>
        <div className={styles.tableScroll}><table className={styles.teamTable}>
          <thead><tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"><span className={styles.srOnly}>Action</span></th></tr></thead>
          <tbody>
            {loading?<tr><td colSpan={4} className={styles.empty}>Loading team members…</td></tr>
            :!error&&data.items.length===0&&data.invitations.length===0?<tr><td colSpan={4} className={styles.empty}>There are no team members or invitations returned by this brand yet.</td></tr>:null}
            {!loading&&!error&&data.items.map(member=><tr key={member.userId}>
              <th scope="row" data-label="Person"><strong>{member.memberName}</strong><small>{member.email??"Email not available"}</small></th>
              <td data-label="Role">{member.roles.map(roleName).join(", ")||"No assigned role"}</td>
              <td data-label="Status"><span className={styles.badgeActive}>● Active</span></td>
              <td data-label="Action" className={styles.actions}>
                {member.canRemove?<button type="button" disabled={busy} onClick={()=>setConfirm({kind:"remove",id:member.userId,person:member.memberName})}>Remove</button>
                  :<small>{member.roles.includes("brand_owner")?"Only owner":member.isSelf?"Your account":"Not removable"}</small>}
              </td>
            </tr>)}
            {!loading&&!error&&data.invitations.map(invite=><tr key={invite.id}>
              <th scope="row" data-label="Person"><strong>{invite.email}</strong><small>Invitation pending acceptance</small></th>
              <td data-label="Role">{roleName(invite.roleCode)}</td>
              <td data-label="Status"><span className={styles.badgeInvite}>● Invite sent</span><small>Expires {new Date(invite.expiresAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</small></td>
              <td data-label="Action" className={styles.actions}><button type="button" disabled={busy} onClick={()=>setConfirm({kind:"cancel",id:invite.id,person:invite.email})}>Cancel invite</button></td>
            </tr>)}
          </tbody>
        </table></div>
      </section>
      <aside className={styles.rolesCard} aria-labelledby="roles-heading">
        <h2 id="roles-heading">Roles</h2>
        <dl>{presetRoles.map(role=><div key={role.id}><dt>{role.name}</dt><dd>{role.description}</dd></div>)}</dl>
      </aside>
    </div>
    {inviteOpen&&<div className={styles.modalScrim} role="presentation">
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="invite-title">
        <header><h2 id="invite-title">Invite someone</h2><button type="button" className={styles.close} aria-label="Close" onClick={()=>setInviteOpen(false)} disabled={busy}>×</button></header>
        <form onSubmit={event=>{event.preventDefault();void write("invite");}}>
          <label htmlFor="invite-email">Work email</label>
          <input id="invite-email" type="email" required maxLength={254} autoComplete="off" placeholder="colleague@example.com" value={email} onChange={event=>setEmail(event.currentTarget.value)} />
          <fieldset><legend>Role</legend>{presetRoles.filter(item=>item.id!=="brand_owner").map(item=>
            <label className={styles.roleOption} key={item.id}><input type="radio" name="invite-role" checked={role===item.id} onChange={()=>setRole(item.id as "catalogue_editor"|"stock_manager")}/><span><strong>{item.name}</strong><small>{item.description}</small></span></label>)}</fieldset>
          <p className={styles.muted}>The invitation expires in 7 days. It grants access to this brand only after the recipient accepts using the same verified email.</p>
          <div className={styles.dialogActions}><button type="button" onClick={()=>setInviteOpen(false)} disabled={busy}>Cancel</button><button className={styles.primary} type="submit" disabled={busy}>{busy?"Sending…":"Send invite"}</button></div>
        </form>
      </section>
    </div>}
    {confirm&&<div className={styles.modalScrim} role="presentation">
      <section className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-note">
        <h2 id="confirm-title">{confirm.kind==="remove"?"Remove access?":"Cancel invitation?"}</h2>
        <p id="confirm-note">{confirm.kind==="remove"?"This immediately revokes access for ":"This cancels the invitation to "}<strong>{confirm.person}</strong>. Existing audit records remain unchanged.</p>
        <div className={styles.dialogActions}><button type="button" onClick={()=>setConfirm(null)} disabled={busy}>Keep</button><button className={styles.danger} type="button" disabled={busy} onClick={()=>void write(confirm.kind,confirm.id)}>{busy?"Saving…":confirm.kind==="remove"?"Remove access":"Cancel invite"}</button></div>
      </section>
    </div>}
  </main>;
}
