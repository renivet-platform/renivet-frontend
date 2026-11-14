import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InventoryAvailability } from "@/features/seller/inventory-availability";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = {
  title: "Inventory | Renivet Brand Workspace",
  description: "Inventory workspace availability for the selected brand.",
  robots: { index: false, follow: false },
};

export default async function BrandInventoryPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const routeState = resolveBrandWorkspaceRoute(brandId, w2PortalEnabled());
  if (routeState === "not-found") notFound();
  if (routeState === "unavailable") return <WorkspaceUnavailable section="inventory" />;
  return <InventoryAvailability brandId={brandId} />;
}
