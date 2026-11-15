import type { Metadata } from "next";
import { BrandApprovals } from "@/features/admin/brand-approvals";

export const metadata: Metadata = { title: "Brand approvals | Renivet" };
export default function BrandApprovalsPage() { return <BrandApprovals />; }
