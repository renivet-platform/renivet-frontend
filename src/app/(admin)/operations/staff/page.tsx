import type { Metadata } from "next";
import { AdminModuleEmptyScreen } from "@/features/admin/admin-module-empty";

export const metadata: Metadata = { title: "Staff and access | Renivet", robots: { index: false, follow: false } };
export default function StaffAccessPage() { return <AdminModuleEmptyScreen kind="staff" />; }
