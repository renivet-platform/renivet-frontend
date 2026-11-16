import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandWorkspaceHome } from "@/features/seller/brand-workspace-home";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = { title: "Brand workspace | Renivet", robots: { index: false, follow: false } };
export default async function BrandWorkspacePage({ params }: { params: Promise<{ brandId: string }> }) { const { brandId } = await params; const state = resolveBrandWorkspaceRoute(brandId, w2PortalEnabled()); if (state === "not-found") notFound(); if (state === "unavailable") return <WorkspaceUnavailable section="brand workspace" />; return <BrandWorkspaceHome brandId={brandId} />; }
