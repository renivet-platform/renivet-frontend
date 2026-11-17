import type { Metadata } from "next";
import { AuthorizedBrandSelection } from "@/features/seller/authorized-brand-selection";

export const metadata: Metadata = { title: "Your brands | Renivet", robots: { index: false, follow: false } };
export default function BrandSelectionPage() { return <AuthorizedBrandSelection />; }
