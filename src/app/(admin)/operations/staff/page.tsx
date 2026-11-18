import type { Metadata } from "next";
import { WorkflowGate } from "@/components/shared/workflow-gate";

export const metadata: Metadata = { title: "Staff and access | Renivet", robots: { index: false, follow: false } };
export default function StaffAccessPage() { return <WorkflowGate screen="Platform access · AD-06" title="Staff and access" detail="Global staff grants, revocation, and independent approval do not have an approved API. This screen cannot grant or change any Renivet role." relatedHref="/operations" relatedLabel="Return to operations home" />; }
