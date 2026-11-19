import type { Metadata } from "next";
import { AdminStaffDirectory } from "@/features/admin/admin-staff-directory";

export const metadata: Metadata = { title: "Staff and access | Renivet", robots: { index: false, follow: false } };
export default function StaffAccessPage() { return <AdminStaffDirectory />; }
