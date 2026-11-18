import type { Metadata } from "next";
import { AdminModuleEmptyScreen } from "@/features/admin/admin-module-empty";

export const metadata: Metadata = { title: "Privacy requests | Renivet", robots: { index: false, follow: false } };
export default function AdminPrivacyPage() { return <AdminModuleEmptyScreen kind="privacy" />; }
