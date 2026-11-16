import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandOnboarding } from "@/features/seller/brand-onboarding";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";

export const metadata: Metadata = { title: "Brand onboarding | Renivet", robots: { index: false, follow: false } };
export default async function BrandOnboardingPage({ params }: { params: Promise<{ brandId: string }> }) { const { brandId } = await params; const state = resolveBrandWorkspaceRoute(brandId, w2PortalEnabled()); if (state === "not-found") notFound(); if (state === "unavailable") return <WorkspaceUnavailable section="onboarding" />; return <BrandOnboarding brandId={brandId} />; }
