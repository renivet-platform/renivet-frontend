import type { Metadata } from "next";
import { WorkflowGate } from "@/components/shared/workflow-gate";

export const metadata: Metadata = { title: "Data requests | Renivet" };
export default function PrivacyRequestsPage() { return <WorkflowGate screen="Data requests · CU-21B" title="Your data requests" detail="Data export and deletion workflows require approved legal rules and a registered request API. This screen does not claim a request was submitted." relatedHref="/account" />; }
