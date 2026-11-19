"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCurrentSession } from "@/features/identity/auth-api";
import { W2ApiError, w2Request } from "@/features/seller/w2-catalog";

export function BrandInvitationAcceptance({brandId,token}:{brandId:string;token:string}) {
  const router=useRouter();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  const next="/brands/invitations/accept?brandId="+encodeURIComponent(brandId)+"&token="+encodeURIComponent(token);
  async function accept() {
    setBusy(true);setMessage("");setError("");
    try{
      const session=await getCurrentSession();
      await w2Request(["brands",brandId,"access","invitations","accept"],{method:"POST",csrfToken:session.csrfToken,body:{token}});
      setMessage("You now have access to this brand.");router.replace("/brands/"+encodeURIComponent(brandId)+"/workspace");
    } catch(e) {
      if(e instanceof W2ApiError) setError(e.status===403?"This invitation is invalid, expired or belongs to a different verified email.":e.message);
      else setError("Sign in with the invited email, then accept the invitation.");
    } finally {setBusy(false);}
  }
  return <main style={{maxWidth:500,margin:"60px auto",padding:24,background:"#fff",border:"1px solid #e1ddd3",borderRadius:10}}>
    <h1>Join a Renivet brand team</h1>
    <p>Only the recipient signed in with the invited verified email can accept this seven-day invitation.</p>
    {error&&<p role="alert" style={{color:"#a3261b"}}>{error}</p>}
    {message&&<p role="status" style={{color:"#1d653a"}}>{message}</p>}
    {!message&&<button type="button" disabled={busy||!token||!brandId} onClick={()=>void accept()} style={{background:"#1f5a45",color:"#fff",border:"0",padding:"12px 20px",borderRadius:7,cursor:"pointer"}}>{busy?"Checking…":"Accept invitation"}</button>}
    <p style={{marginTop:18}}><Link href={"/sign-in?next="+encodeURIComponent(next)}>Sign in with invited email</Link></p>
  </main>;
}
