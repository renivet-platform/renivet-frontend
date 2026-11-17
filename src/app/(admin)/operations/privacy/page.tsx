import type { Metadata } from "next";
import { WorkflowGate } from "@/components/shared/workflow-gate";

export const metadata: Metadata = { title: "Privacy requests | Renivet", robots: { index: false, follow: false } };
export default function AdminPrivacyPage() { return <WorkflowGate screen="Privacy operations · AD-19" title="Privacy requests" detail="Privacy operations need approved legal handling, retention rules, and a registered review API. This page cannot create, resolve, or mislabel a request." relatedHref="/operations" relatedLabel="Return to operations home" />; }
