"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AuthApiError, getCurrentSession, logoutCurrentSession, type CurrentSession } from "@/features/identity/auth-api";
import { buildWorkspaceNavigation, mobileWorkspaceLinks, type WorkspaceGroup, type WorkspaceNavigationItem } from "./workspace-navigation";
import styles from "./workspace-shell.module.css";

const groupLabels: Partial<Record<WorkspaceGroup, string>> = {
  catalogue: "Catalogue",
  operations: "Operations",
  brand: "Brand",
  queues: "Review queues",
  platform: "Platform",
};

function Icon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    Home: "M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-6v-6h-5v6h-6a.5.5 0 0 1-.5-.5z",
    Products: "M12 3 21 7.5v9L12 21l-9-4.5v-9z M3.5 7.8 12 12l8.5-4.2 M12 12v9",
    Inventory: "m12 3 9 4.5-9 4.5-9-4.5z M3 12l9 4.5 9-4.5 M3 16.5 12 21l9-4.5",
    Imports: "M12 3v12m-4-4 4 4 4-4 M4 18v3h16v-3",
    "Brand applications": "M4 21h16M6 21V8l6-5 6 5v13M9 12h.01M15 12h.01M9 16h.01M15 16h.01",
    "Product quality": "M12 3 20 6v5c0 5-3.3 8-8 10-4.7-2-8-5-8-10V6z M8 12l2.5 2.5L16 9",
    "Inventory exceptions": "M12 3 22 21H2z M12 9v5m0 3h.01",
  };
  return <svg className={styles.icon} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[label] ?? "M4 5h16M4 12h16M4 19h16"} /></svg>;
}

function NavigationLink({ item, onNavigate, mobile = false }: { item: WorkspaceNavigationItem; onNavigate?: () => void; mobile?: boolean }) {
  return <Link href={item.href} onClick={onNavigate} className={`${styles.navLink} ${item.active ? styles.active : ""} ${mobile ? styles.mobileNavLink : ""}`} aria-current={item.active ? "page" : undefined}>
    <span className={styles.navLabel}>{item.label}</span>{mobile && <Icon label={item.label} />}
  </Link>;
}

export function WorkspaceShell({ role, children }: { role: "seller" | "admin"; children: ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [session, setSession] = useState<CurrentSession | null>(null);
  const [sessionState, setSessionState] = useState<"checking" | "active" | "expired" | "unavailable">("checking");
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [brandName, setBrandName] = useState("Brand workspace");
  const items = buildWorkspaceNavigation(role, pathname);
  const mobileItems = mobileWorkspaceLinks(role, items);

  useEffect(() => {
    if (role !== "seller") return;
    const brandId = pathname.match(/^\/brands\/([^/]+)/)?.[1];
    if (!brandId) return;
    let live = true;
    void getCurrentSession().then((session) => {
      if (!live || session.destination.kind !== "brands") return;
      const brand = session.destination.brands.find((entry) => entry.id === brandId);
      if (brand) setBrandName(brand.name);
    }).catch(() => { /* Session and route authorization are checked by the API; keep the neutral label. */ });
    return () => { live = false; };
  }, [pathname, role]);

  useEffect(() => {
    let live = true;
    setSessionState("checking");
    getCurrentSession().then((value) => {
      if (!live) return;
      setSession(value);
      setSessionState("active");
      if (role === "admin" && value.destination.kind !== "operations") {
        router.replace("/account");
      } else if (role === "seller" && value.destination.kind !== "brands" && value.destination.kind !== "operations") {
        router.replace("/account");
      }
    }).catch((error: unknown) => {
      if (!live) return;
      setSession(null);
      setSessionState(error instanceof AuthApiError && error.status === 401 ? "expired" : "unavailable");
    });
    return () => { live = false; };
  }, [role, router, pathname]);

  async function signOut() {
    if (!session || signOutBusy) return;
    setSignOutBusy(true);
    setSignOutError("");
    try {
      await logoutCurrentSession(session.csrfToken);
      setSession(null);
      setSessionState("expired");
      setMenuOpen(false);
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setSignOutError("Sign out could not be confirmed. Please try again.");
    } finally { setSignOutBusy(false); }
  }

  const signedInName = session?.profile?.displayName?.trim() || session?.profile?.email || "Your account";

  const home = items.find((item) => item.group === "home");
  const grouped = (Object.keys(groupLabels) as WorkspaceGroup[]).map((group) => ({
    group,
    label: groupLabels[group]!,
    items: items.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0);

  return <div className={styles.frame} data-role={role}>
    <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} aria-label={`${role === "seller" ? "Brand" : "Operations"} navigation`}>
      <Link className={styles.brand} href={home?.href ?? "/"} onClick={() => setMenuOpen(false)}>
        <span className={styles.wordmark}>RENIVET</span><span className={styles.brandDescriptor}>{role === "seller" ? "Brand workspace" : "Renivet operations"}</span>
      </Link>
      {role === "seller" ? <div className={styles.brandSwitch}><span className={styles.brandMark} aria-hidden="true">{brandName.charAt(0).toUpperCase()}</span><span className={styles.brandIdentity}><strong>{brandName}</strong><Link href="/brands" onClick={() => setMenuOpen(false)}>Choose an authorized brand</Link></span></div> : <div className={styles.signedInNote}><strong>{sessionState === "active" ? signedInName : "Checking your account…"}</strong><span>{session?.profile?.email ?? (sessionState === "expired" ? "Session expired" : "Operations reviewer")}</span></div>}
      <nav className={styles.nav}>
        {home && <NavigationLink item={home} onNavigate={() => setMenuOpen(false)} />}
        {grouped.map((section) => <section className={styles.navSection} key={section.group} aria-label={section.label}>
          <h2>{section.label}</h2>
          {section.items.map((item) => <NavigationLink key={item.href} item={item} onNavigate={() => setMenuOpen(false)} />)}
        </section>)}
      </nav>
      <div className={styles.accountControls}>
        {sessionState === "active" ? <>
          <div className={styles.accountIdentity}><span className={styles.avatar} aria-hidden="true">{signedInName.charAt(0).toUpperCase()}</span><span><strong>{signedInName}</strong><small>{session?.profile?.email || "Signed in"}</small></span></div>
          <Link className={styles.accountLink} href="/account" onClick={() => setMenuOpen(false)}>Account &amp; security</Link>
          <button className={styles.signOut} type="button" disabled={signOutBusy} onClick={() => void signOut()}>{signOutBusy ? "Signing out…" : "Sign out"}</button>
          {signOutError && <p role="alert" className={styles.sessionError}>{signOutError}</p>}
        </> : <Link className={styles.accountLink} href="/sign-in" onClick={() => setMenuOpen(false)}>{sessionState === "expired" ? "Session expired · Sign in" : "Sign in to manage account"}</Link>}
      </div>
    </aside>
    {menuOpen && <button className={styles.scrim} type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <div className={styles.content}>
      <header className={styles.mobileHeader}>
        <button type="button" className={styles.menuButton} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span aria-hidden="true">{menuOpen ? "×" : "☰"}</span></button>
        <Link href={home?.href ?? "/"} className={styles.mobileBrand}>RENIVET</Link>
        <Link href="/account" className={styles.accountAction}>Account</Link>
      </header>
      <div className={styles.page}>{sessionState === "expired"
        ? <section className={styles.sessionNotice} role="alert"><h2>Sign in to continue</h2><p>Your session is no longer active. Your work is protected until you sign in again.</p><Link href={"/sign-in?next=" + encodeURIComponent(pathname)}>Sign in</Link></section>
        : sessionState === "checking" ? <p role="status" className={styles.sessionNotice}>Checking your signed-in session…</p>
        : sessionState === "unavailable" ? <section className={styles.sessionNotice} role="alert"><h2>Unable to verify session</h2><p>Check the backend connection and try refreshing. No account state was changed.</p></section>
        : children}</div>
      <nav className={styles.mobileNav} aria-label={role === "seller" ? "Brand shortcuts" : "Operations shortcuts"}>{mobileItems.map((item) => <NavigationLink key={item.href} item={item} mobile />)}</nav>
    </div>
  </div>;
}
