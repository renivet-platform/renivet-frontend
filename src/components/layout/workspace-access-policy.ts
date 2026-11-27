/** Public seller acquisition screens; never a generic exemption for brand workspaces. */
export function isPublicSellerApplicationRoute(role: "seller" | "admin", pathname: string): boolean {
  return role === "seller" && (pathname === "/brands/join" || pathname === "/brands/join/application");
}
