import type { Metadata } from "next";
import { AdminOperationsConsole } from "@/features/admin/operations-console";

export const metadata: Metadata = {
  title: "Operations review | Renivet",
  description: "Authenticated Renivet review queues for taxonomy, QC, pricing, sustainability claims and catalog publication.",
  robots: { index: false, follow: false },
};

export default function OperationsPage() {
  return <AdminOperationsConsole />;
}
