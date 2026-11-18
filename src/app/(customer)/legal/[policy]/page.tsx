import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyContentScreen } from "@/features/storefront/shop-context-screens";

export const metadata: Metadata = { title: "Policies | Renivet" };
const supportedPolicies = new Set(["terms", "privacy", "returns", "shipping"]);
export default async function LegalPolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  if (!supportedPolicies.has(policy)) notFound();
  return <PolicyContentScreen policy={policy} />;
}
