"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSession, logoutCurrentSession, type CurrentSession } from "@/features/identity/auth-api";
import Link from "next/link";
import styles from "./storefront-home.module.css";

const craftNotes = ["Ajrakh", "Dabu", "Handloom", "Shibori", "Block print"];

export function StorefrontHome() {
  const router=useRouter();
  const [session,setSession]=useState<CurrentSession|null>(null);
  const [signOutBusy,setSignOutBusy]=useState(false);
  const [accountError,setAccountError]=useState("");
  useEffect(()=>{
    let live=true;
    getCurrentSession().then(value=>{if(live)setSession(value);}).catch(()=>{if(live)setSession(null);});
    return ()=>{live=false;};
  },[]);
  async function signOut(){
    if(!session||signOutBusy)return;
    setSignOutBusy(true);setAccountError("");
    try{
      await logoutCurrentSession(session.csrfToken);
      setSession(null);
      router.refresh();
    }catch{
      setAccountError("Could not confirm sign out. Try again.");
    }finally{setSignOutBusy(false);}
  }
  const accountLabel=session?.profile?.displayName?.trim()||session?.profile?.email||"Account";
  const workspacePath=session?.destination.kind==="operations"?"/operations":session?.destination.kind==="brands"?"/brands":"/account";
  return <div className={styles.page} data-screen-id="CU-01">
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/" aria-label="Renivet home">RENIVET</Link>
      <nav className={styles.primaryNav} aria-label="Shop navigation"><Link className={styles.current} href="/">New in</Link><Link href="/shop/brands">Brands</Link><Link href="/shop/brands">The makers</Link></nav>
      <nav className={styles.accountNav} aria-label="Your account"><Link href="/shop/brands" aria-label="Search brands">Search</Link><Link href="/shop/saved">Saved</Link>{session ? <><Link href="/account" title={accountLabel}>{accountLabel}</Link><Link href={workspacePath}>Workspace</Link><button type="button" disabled={signOutBusy} onClick={()=>void signOut()}>{signOutBusy?"Signing out…":"Sign out"}</button></> : <Link href="/sign-in">Sign in</Link>}</nav>
    </header>
    {accountError&&<p role="alert" style={{margin:"10px auto",maxWidth:"1176px",color:"#9d3028"}}>{accountError}</p>}
    <main>
      <section className={styles.hero} aria-labelledby="storefront-title">
        <div className={styles.heroCopy}><p className={styles.kicker}>NEW THIS WEEK</p><h1 id="storefront-title">Made by hand, with the proof to show for it.</h1><p>Clothes from independent Indian brands. Every brand is reviewed before it sells here, and every claim tells you how it was checked.</p><div className={styles.actions}><Link className={styles.primary} href="/shop/brands">Meet the brands</Link><Link className={styles.secondary} href="/shop/saved">Your saved pieces</Link></div></div>
        <div className={styles.heroArt} aria-label="Renivet textile pattern illustration"><span>RENIVET · INDEPENDENT BRANDS</span></div>
      </section>
      <section className={styles.arrivals} aria-labelledby="arrivals-title">
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>THE SHOP</p><h2 id="arrivals-title">New arrivals</h2><p>Browse by craft, or search for a piece or a brand.</p></div><span className={styles.contextBadge}>W3 catalogue connection pending</span></div>
        <div className={styles.searchRow}><label className={styles.searchBox}><span aria-hidden="true">⌕</span><span className={styles.visuallyHidden}>Search products and brands</span><input type="search" placeholder="Search kurtas, sarees, brands…" disabled /></label></div>
        <div className={styles.craftList} aria-label="Craft categories not yet available"><span>All crafts</span>{craftNotes.map((craft, index) => <span className={styles.craft} data-pattern={index} key={craft}>{craft}</span>)}</div>
        <div className={styles.emptyCatalog}><span className={styles.emptyGlyph} aria-hidden="true">R</span><div><h3>Product browsing is not connected yet</h3><p>No product listings or sample prices are displayed. The public catalogue will appear here when its API and release scope are approved.</p></div><Link href="/shop/brands">View the brand directory</Link></div>
        <div className={styles.productGridContext} aria-label="Product card layout preview (no public listings loaded)">
          {Array.from({length:8},(_,index)=><article className={styles.productTile} key={index}>
            <span className={styles.productTileImage} data-pattern={index%4} aria-hidden="true" />
            <span className={styles.productTileState}>W3 catalogue pending</span>
            <strong>Product details unavailable</strong>
            <small>Price, approved claims and availability will come from the public catalogue.</small>
          </article>)}
        </div>
      </section>
      <section className={styles.trust} aria-label="How Renivet reviews products"><article><span aria-hidden="true">◈</span><div><h3>Brands reviewed first</h3><p>Business and payout details are reviewed before a brand can sell.</p></div></article><article><span aria-hidden="true">✓</span><div><h3>Claims show their evidence</h3><p>Each checked claim explains what supports it and who reviewed it.</p></div></article><article><span aria-hidden="true">₹</span><div><h3>Honest prices</h3><p>Prices are shown after Renivet review and approval.</p></div></article></section>
    </main>
    <footer className={styles.footer}><span>Renivet · Independent brands</span><nav aria-label="Policies and account"><Link href="/legal/terms">Terms of use</Link><Link href="/legal/privacy">Privacy notice</Link><Link href="/sign-in">Account</Link></nav></footer>
  </div>;
}
