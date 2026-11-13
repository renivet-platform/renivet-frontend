import type { Metadata } from "next";
import { AdminOperationsConsole } from "@/features/admin/operations-console";

export const metadata: Metadata = {
  title: "Operations review | Renivet",
  description: "A W2 operations review workspace preview with explicit API and authorization boundaries.",
  robots: { index: false, follow: false },
};

export default function OperationsPage() {
  return <AdminOperationsConsole />;
}
