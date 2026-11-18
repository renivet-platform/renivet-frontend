import type { Metadata } from "next";
import { SellerJoinScreen } from "@/features/seller/seller-join-screen";

export const metadata: Metadata = { title: "Sell on Renivet | Renivet" };
export default function SellerJoinPage() { return <SellerJoinScreen />; }
