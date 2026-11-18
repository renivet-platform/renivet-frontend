import type { Metadata } from "next";
import { OperationsHome } from "@/features/admin/operations-home";

export const metadata: Metadata = {
  title: "Operations review | Renivet",
  description: "Operations queue overview based on persisted Renivet review data.",
  robots: { index: false, follow: false },
};

export default function OperationsPage() {
  return <OperationsHome />;
}
