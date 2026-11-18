export type WorkspaceGroup = "home" | "catalogue" | "operations" | "brand" | "queues" | "platform";
export type WorkspaceNavigationItem = { label: string; href: string; active: boolean; group: WorkspaceGroup };

const sellerLinks: Array<[string, string, WorkspaceGroup]> = [
  ["Home", "workspace", "home"],
  ["Products", "products", "catalogue"],
  ["Imports", "imports", "catalogue"],
  ["Inventory", "inventory", "operations"],
  ["Team & access", "team", "brand"],
  ["Payout account", "payouts", "brand"],
];

const adminLinks: Array<[string, string, WorkspaceGroup]> = [
  ["Home", "/operations", "home"],
  ["Brand applications", "/brand-approvals", "queues"],
  ["Bank verification", "/operations/bank", "queues"],
  ["Product quality", "/operations/quality", "queues"],
  ["Claims & evidence", "/operations/claims", "queues"],
  ["Pricing", "/operations/pricing", "queues"],
  ["Publishing", "/operations/publishing", "queues"],
  ["Taxonomy", "/taxonomy", "platform"],
  ["Inventory exceptions", "/operations/exceptions", "platform"],
  ["Staff & access", "/operations/staff", "platform"],
  ["Audit log", "/operations/audit", "platform"],
  ["Privacy requests", "/operations/privacy", "platform"],
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildWorkspaceNavigation(role: "seller" | "admin", pathname: string): WorkspaceNavigationItem[] {
  if (role === "seller") {
    const brandId = pathname.match(/^\/brands\/([^/]+)/)?.[1];
    if (!brandId || !UUID.test(brandId)) return [];
    const base = `/brands/${brandId}`;
    const links: WorkspaceNavigationItem[] = sellerLinks.map(([label, segment, group]) => {
      const href = `${base}/${segment}`;
      return { label, href, group, active: pathname === href || pathname.startsWith(`${href}/`) };
    });
    links.push({ label: "Switch brand", href: "/brands", group: "brand", active: pathname === "/brands" });
    return links;
  }
  return adminLinks.map(([label, href, group]) => ({
    label,
    href,
    group,
    active: href === "/operations" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`),
  }));
}

export function mobileWorkspaceLinks(role: "seller" | "admin", items: WorkspaceNavigationItem[]) {
  const labels = role === "seller" ? ["Home", "Products", "Inventory", "Imports"] : ["Home", "Product quality", "Brand applications", "Inventory exceptions"];
  return labels.map((label) => items.find((item) => item.label === label)).filter((item): item is WorkspaceNavigationItem => Boolean(item));
}
