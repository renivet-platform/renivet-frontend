import type { Metadata } from "next";
import { WorkflowGate } from "@/components/shared/workflow-gate";

export const metadata: Metadata = { title: "Sell on Renivet | Renivet" };
export default function SellerJoinPage() {
  return <WorkflowGate screen="Seller onboarding · SE-01 to SE-06" title="Start a brand application" detail="Brand applications, private document uploads, bank verification, and correction submissions are not connected to approved backend workflows yet." relatedHref="/sign-in?next=%2Fbrands%2Fjoin" relatedLabel="Sign in to Renivet" />;
}
