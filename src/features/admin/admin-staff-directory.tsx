"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import {W2ApiError,w2Request} from "@/features/seller/w2-catalog";
import styles from "./admin-staff-directory.module.css";

type Staff = {userId:string;name:string;email:string|null;role:string;activeFrom:string;activeUntil:string|null};
export function AdminStaffDirectory(){
  const [items,setItems]=useState<Staff[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [role,setRole]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const result=await w2Request<{items:Staff[]}>(["admin","staff"]);
      setItems(result.items??[]);
    }catch(cause){
      setItems([]);
      setError(cause instanceof W2ApiError&&cause.status===403?"Your account does not have permission to view platform staff.":
        "Not connected: authorized staff directory data is unavailable.");
    }finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load()},[load]);
  const roles=useMemo(()=>Array.from(new Set(items.map(item=>item.role))).sort(),[items]);
  const visible=useMemo(()=>items.filter(item=>(!role||item.role===role)&&
    [item.name,item.email??"",item.role].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[items,search,role]);
  return <main className={styles.page} data-screen-id="AD-06">
    <header className={styles.header}>
      <div><p className={styles.kicker}>RENIVET OPERATIONS / AD-06</p><h1>Staff and access</h1>
      <p>View who can access Renivet operations, based on live staff assignments.</p></div>
      <button type="button" onClick={()=>void load()} disabled={loading}>{loading?"Loading…":"Refresh"}</button>
    </header>
    {error&&<div className={styles.warning} role="alert"><strong>Staff directory unavailable</strong><p>{error} No account permissions have been changed.</p></div>}
    <section className={styles.filterPanel}>
      <div><h2>Find staff</h2><p>Search names, accounts or assigned roles.</p></div>
      <div className={styles.filters}>
        <label>Search<input type="search" placeholder="Search staff" value={search} onChange={e=>setSearch(e.currentTarget.value)}/></label>
        <label>Role<select value={role} onChange={e=>setRole(e.currentTarget.value)}><option value="">All roles</option>{roles.map(r=><option key={r} value={r}>{r.replaceAll("_"," ")}</option>)}</select></label>
      </div>
    </section>
    <section className={styles.panel} aria-label="Persisted platform staff">
      <div className={styles.heading}><h2>Active platform staff</h2><span>Read only · {visible.length} {visible.length===1?"assignment":"assignments"}</span></div>
      <div className={styles.tableWrap}><table><thead><tr><th scope="col">Person</th><th scope="col">Platform role</th><th scope="col">Status</th><th scope="col">Assigned since</th></tr></thead><tbody>
        {visible.map(item=><tr key={item.userId+item.role}>
          <td data-label="Person"><strong>{item.name}</strong><small>{item.email??"Email not provided"}</small>{item.email?.endsWith("@example.invalid")?<small>Development sample</small>:null}</td>
          <td data-label="Platform role">{item.role.replaceAll("_"," ")}</td>
          <td data-label="Status"><span className={styles.active}>Active</span></td>
          <td data-label="Assigned since">{item.activeFrom?new Date(item.activeFrom).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</td>
        </tr>)}
      </tbody></table></div>
      {loading&&<p className={styles.empty} role="status">Loading staff records…</p>}
      {!loading&&!error&&!visible.length&&<p className={styles.empty}>No staff matches these filters. No records have been invented.</p>}
      {!loading&&Boolean(error)&&<p className={styles.empty}>Records are unavailable until the authorized service is connected.</p>}
    </section>
    <section className={styles.policy}><h2>Access changes</h2><p>Staff invitations, grants, revocations and independent approval are not connected on this page. No changes can be made here until those audited backend operations are ready.</p></section>
  </main>;
}
