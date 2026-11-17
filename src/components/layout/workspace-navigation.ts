export type WorkspaceNavigationItem = { label: string; href: string; active: boolean };

const sellerLinks = [
  ["Overview", "workspace"],
  ["Products", "products"],
  ["Imports", "imports"],
  ["Inventory", "inventory"],
  ["Team", "team"],
  ["Setup", "onboarding"],
] as const;

const adminLinks = [
  ["Operations", "/operations"],
  ["Quality review", "/operations/quality"],
  ["Pricing review", "/operations/pricing"],
  ["Claims & evidence", "/operations/claims"],
  ["Publishing", "/operations/publishing"],
  ["Taxonomy", "/taxonomy"],
  ["Brand approvals", "/brand-approvals"],
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildWorkspaceNavigation(role: "seller" | "admin", pathname: string): WorkspaceNavigationItem[] {
  if (role === "seller") {
    const brandId = pathname.match(/^\/brands\/([^/]+)/)?.[1];
    if (!brandId || !UUID.test(brandId)) return [];
    const base = `/brands/${brandId}`;
    return sellerLinks.map(([label, segment]) => {
      const href = `${base}/${segment}`;
      return { label, href, active: pathname === href || pathname.startsWith(`${href}/`) };
    });
  }
  return adminLinks.map(([label, href]) => ({
    label,
    href,
    active: href === "/operations" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`),
  }));
}
