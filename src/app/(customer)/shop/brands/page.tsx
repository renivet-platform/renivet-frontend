import type { Metadata } from "next";
import { BrandDirectoryScreen } from "@/features/storefront/shop-context-screens";

export const metadata: Metadata = { title: "Independent brands | Renivet" };
export default function ShopBrandsPage() { return <BrandDirectoryScreen />; }
