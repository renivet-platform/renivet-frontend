import type { Metadata } from "next";
import { AdminModuleEmptyScreen } from "@/features/admin/admin-module-empty";

export const metadata: Metadata = { title: "Audit log | Renivet", robots: { index: false, follow: false } };
export default function AuditLogPage() { return <AdminModuleEmptyScreen kind="audit" />; }
