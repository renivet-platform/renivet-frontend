import type { Metadata } from "next";
import { WorkflowGate } from "@/components/shared/workflow-gate";

export const metadata: Metadata = { title: "Inventory exceptions | Renivet", robots: { index: false, follow: false } };
export default function InventoryExceptionsPage() { return <WorkflowGate screen="Inventory operations · AD-09" title="Inventory exceptions" detail="The inventory service is still behind its release gates, and no admin exception queue is registered in the current API contract. No stock data is fabricated here." relatedHref="/operations" relatedLabel="Return to operations home" />; }
