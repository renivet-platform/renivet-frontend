"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { buildWorkspaceNavigation } from "./workspace-navigation";
import styles from "./workspace-shell.module.css";

export function WorkspaceShell({ role, children }: { role: "seller" | "admin"; children: ReactNode }) {
  const pathname = usePathname() || "/";
  const items = buildWorkspaceNavigation(role, pathname);
  return (
    <div className={styles.frame} data-role={role}>
      <aside className={styles.sidebar} aria-label={`${role === "seller" ? "Brand" : "Operations"} navigation`}>
        <Link className={styles.brand} href={role === "seller" ? items[0]?.href ?? "/" : "/operations"}>
          <span className={styles.mark} aria-hidden="true">r</span><span>renivet</span>
        </Link>
        <p className={styles.eyebrow}>{role === "seller" ? "BRAND WORKSPACE" : "OPERATIONS"}</p>
        <nav className={styles.nav}>
          {items.map((item) => <Link key={item.href} href={item.href} className={item.active ? styles.active : styles.link} aria-current={item.active ? "page" : undefined}>{item.label}</Link>)}
        </nav>
        <p className={styles.note}>Access and available actions are confirmed by Renivet services.</p>
      </aside>
      <div className={styles.content}>
        <header className={styles.mobileHeader}><Link href={role === "seller" ? items[0]?.href ?? "/" : "/operations"} className={styles.brand}><span className={styles.mark} aria-hidden="true">r</span>renivet</Link><span>{role === "seller" ? "Brand workspace" : "Operations"}</span></header>
        <div className={styles.page}>{children}</div>
        <nav className={styles.mobileNav} aria-label="Workspace navigation">{items.map((item) => <Link key={item.href} href={item.href} className={item.active ? styles.mobileActive : styles.mobileLink} aria-current={item.active ? "page" : undefined}>{item.label}</Link>)}</nav>
      </div>
    </div>
  );
}
