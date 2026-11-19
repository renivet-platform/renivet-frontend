import type { Metadata } from "next";
import { AdminAuditScreen } from "@/features/admin/admin-audit-prototype";

export const metadata: Metadata = { title: "Audit log | Renivet", robots: { index: false, follow: false } };
export default function AuditLogPage() { return <AdminAuditScreen />; }
