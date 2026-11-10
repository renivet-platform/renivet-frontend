import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductWorkspace } from "@/features/seller/product-workspace";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = {
  title: "Products | Renivet Brand Workspace",
  description: "Manage progressive product drafts in the Renivet brand workspace.",
  robots: { index: false, follow: false },
};

export default async function BrandProductsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  if (!w2PortalEnabled() || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(brandId)) notFound();
  return <ProductWorkspace brandId={brandId} />;
}
