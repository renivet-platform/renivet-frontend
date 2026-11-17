import type { Metadata } from "next";
import { WorkflowGate } from "@/components/shared/workflow-gate";

export const metadata: Metadata = { title: "Privacy and communication | Renivet" };
export default function PrivacyPreferencesPage() { return <WorkflowGate screen="Account privacy · CU-21A" title="Privacy and communication" detail="Consent wording and communication preferences need an approved legal contract and API before they can be saved. No preference is preselected or silently recorded." relatedHref="/account" />; }
