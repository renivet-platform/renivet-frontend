import type { SessionDestination } from "./auth-api";

const BRAND_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function defaultDestination(destination: SessionDestination): string {
  if (destination.kind === "operations") return "/operations";
  if (destination.kind === "brands") {
    if (destination.brands.length === 1) return `/brands/${encodeURIComponent(destination.brands[0].id)}/workspace`;
    return "/brands";
  }
  return "/";
}

export function resolvePostSignInPath(target: string | null | undefined, destination: SessionDestination): string {
  const fallback = defaultDestination(destination);
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.includes("\\")) return fallback;
  let url: URL;
  try { url = new URL(target, "https://renivet.invalid"); } catch { return fallback; }
  if (url.origin !== "https://renivet.invalid") return fallback;
  const path = `${url.pathname}${url.search}${url.hash}`;
  // Applying for a new brand is allowed for authenticated customers and
  // existing sellers; it does not grant a brand workspace permission.
  if (destination.kind !== "operations" && ["/brands/join", "/brands/join/application"].includes(url.pathname)) return path;

  if (destination.kind === "operations") {
    return ["/operations", "/taxonomy", "/brand-approvals"].some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) ? path : fallback;
  }
  if (destination.kind === "brands") {
    if (url.pathname === "/brands") return path;
    const match = url.pathname.match(/^\/brands\/([^/]+)(?:\/|$)/);
    let brandId = "";
    try { brandId = match?.[1] ? decodeURIComponent(match[1]) : ""; } catch { return fallback; }
    if (BRAND_ID.test(brandId) && destination.brands.some((brand) => brand.id.toLowerCase() === brandId.toLowerCase())) return path;
    return fallback;
  }
  return url.pathname === "/" || url.pathname === "/account" ? path : fallback;
}

export function appendReturnTarget(href: string, target: string | null | undefined): string {
  if (!target) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}next=${encodeURIComponent(target)}`;
}
