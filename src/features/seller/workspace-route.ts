const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type BrandWorkspaceRouteState = "not-found" | "unavailable" | "available";

export function resolveBrandWorkspaceRoute(brandId: string, enabled: boolean): BrandWorkspaceRouteState {
  if (!uuidPattern.test(brandId)) return "not-found";
  return enabled ? "available" : "unavailable";
}
