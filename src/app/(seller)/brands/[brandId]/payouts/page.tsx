import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkflowGate } from "@/components/shared/workflow-gate";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = { title: "Payout account | Renivet", robots: { index: false, follow: false } };
export default async function BrandPayoutsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const state = resolveBrandWorkspaceRoute(brandId, w2PortalEnabled());
  if (state === "not-found") notFound();
  if (state === "unavailable") return <WorkspaceUnavailable section="payout account" />;
  return <WorkflowGate screen="Seller payout · SE-18" title="Payout account" detail="Bank verification and payout account changes require an approved finance contract. Payout details cannot be entered or marked as verified here." relatedHref={`/brands/${encodeURIComponent(brandId)}/workspace`} relatedLabel="Return to brand workspace" />;
}
