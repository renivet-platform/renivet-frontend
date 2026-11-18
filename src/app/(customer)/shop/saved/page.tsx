import type { Metadata } from "next";
import { SavedItemsScreen } from "@/features/storefront/shop-context-screens";

export const metadata: Metadata = { title: "Saved pieces | Renivet" };
export default function SavedItemsPage() { return <SavedItemsScreen />; }
