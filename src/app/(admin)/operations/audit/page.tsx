import type { Metadata } from "next";
import { WorkflowGate } from "@/components/shared/workflow-gate";

export const metadata: Metadata = { title: "Audit log | Renivet", robots: { index: false, follow: false } };
export default function AuditLogPage() { return <WorkflowGate screen="Platform audit · AD-20" title="Audit log" detail="An access-controlled audit read API is not registered, so no audit events are shown or implied by this screen." relatedHref="/operations" relatedLabel="Return to operations home" />; }
