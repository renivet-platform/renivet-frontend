import type { Metadata } from "next";
import { BrandApprovals } from "@/features/admin/brand-approvals";

export const metadata: Metadata = { title: "Review brand application | Renivet" };

export default async function BrandApplicationReviewPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  return <BrandApprovals key={brandId} detailBrandId={brandId} />;
}
