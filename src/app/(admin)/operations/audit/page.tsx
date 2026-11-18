import type { Metadata } from "next";
import { AdminAuditScreen } from "@/features/admin/admin-audit";

export const metadata: Metadata = { title: "Audit log | Renivet", robots: { index: false, follow: false } };
export default function AuditLogPage() { return <AdminAuditScreen />; }
