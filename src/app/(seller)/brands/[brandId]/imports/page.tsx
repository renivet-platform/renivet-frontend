import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImportWorkspace } from "@/features/seller/import-workspace";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = {
  title: "Product imports | Renivet Brand Workspace",
  description: "Upload, map and review a product import for the authorized brand.",
  robots: { index: false, follow: false },
};

export default async function BrandImportsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  if (!w2PortalEnabled() || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(brandId)) notFound();
  return <ImportWorkspace brandId={brandId} />;
}
