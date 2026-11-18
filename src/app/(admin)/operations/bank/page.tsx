import type { Metadata } from "next";
import { AdminModuleEmptyScreen } from "@/features/admin/admin-module-empty";

export const metadata: Metadata = { title: "Bank verification | Renivet", robots: { index: false, follow: false } };
export default function BankVerificationPage() { return <AdminModuleEmptyScreen kind="bank" />; }
