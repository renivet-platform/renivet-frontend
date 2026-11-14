import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductWorkspace } from "@/features/seller/product-workspace";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = {
  title: "Products | Renivet Brand Workspace",
  description: "Manage progressive product drafts in the Renivet brand workspace.",
  robots: { index: false, follow: false },
};

export default async function BrandProductsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const routeState = resolveBrandWorkspaceRoute(brandId, w2PortalEnabled());
  if (routeState === "not-found") notFound();
  if (routeState === "unavailable") return <WorkspaceUnavailable section="product" />;
  return <ProductWorkspace brandId={brandId} />;
}
