import type { Metadata } from "next";
import { WorkflowGate } from "@/components/shared/workflow-gate";

export const metadata: Metadata = { title: "Bank verification | Renivet", robots: { index: false, follow: false } };
export default function BankVerificationPage() { return <WorkflowGate screen="Finance review · AD-05" title="Bank verification" detail="No approved bank evidence and verification API is registered. This screen does not accept bank details or create a verification decision." relatedHref="/operations/applications" relatedLabel="Review available brand applications" />; }
