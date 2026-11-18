import type { Metadata } from "next";
import { SellerApplicationScreen } from "@/features/seller/seller-application-screen";

export const metadata: Metadata = { title: "Brand application | Renivet", robots: { index: false, follow: false } };
export default function SellerApplicationPage() { return <SellerApplicationScreen />; }
