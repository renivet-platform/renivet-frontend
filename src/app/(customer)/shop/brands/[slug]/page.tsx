import type { Metadata } from "next";
import { BrandProfileScreen } from "@/features/storefront/shop-context-screens";

export const metadata: Metadata = { title: "Brand profile | Renivet" };
export default async function ShopBrandProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BrandProfileScreen slug={slug} />;
}
