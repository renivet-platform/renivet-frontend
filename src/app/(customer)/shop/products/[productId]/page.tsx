import type { Metadata } from "next";
import { ProductDetailScreen } from "@/features/storefront/shop-context-screens";

export const metadata: Metadata = { title: "Product details | Renivet" };
export default async function ShopProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductDetailScreen productId={productId} />;
}
