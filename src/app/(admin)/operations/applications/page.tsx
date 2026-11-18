import type { Metadata } from "next";
import { BrandApprovals } from "@/features/admin/brand-approvals";

export const metadata: Metadata = { title: "Brand applications | Renivet", robots: { index: false, follow: false } };
export default function OperationsApplicationsPage() { return <BrandApprovals />; }
