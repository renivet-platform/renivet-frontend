import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImportWorkspace } from "@/features/seller/import-workspace";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = {
  title: "Product imports | Renivet Brand Workspace",
  description: "Upload, map and review a product import for the authorized brand.",
  robots: { index: false, follow: false },
};

export default async function BrandImportsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const routeState = resolveBrandWorkspaceRoute(brandId, w2PortalEnabled());
  if (routeState === "not-found") notFound();
  if (routeState === "unavailable") return <WorkspaceUnavailable section="product import" />;
  return <ImportWorkspace brandId={brandId} />;
}
