import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailWorkspace } from "@/features/seller/product-detail-workspace";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = {
  title: "Product draft | Renivet Brand Workspace",
  description: "Continue editing a saved product draft in the Renivet brand workspace.",
  robots: { index: false, follow: false },
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function BrandProductDetailPage({ params }: { params: Promise<{ brandId: string; productId: string }> }) {
  const { brandId, productId } = await params;
  if (!uuidPattern.test(productId)) notFound();
  const routeState = resolveBrandWorkspaceRoute(brandId, w2PortalEnabled());
  if (routeState === "not-found") notFound();
  if (routeState === "unavailable") return <WorkspaceUnavailable section="product draft" />;
  return <ProductDetailWorkspace brandId={brandId} productId={productId} />;
}
