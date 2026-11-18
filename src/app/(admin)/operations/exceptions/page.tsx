import type { Metadata } from "next";
import { AdminModuleEmptyScreen } from "@/features/admin/admin-module-empty";

export const metadata: Metadata = { title: "Inventory exceptions | Renivet", robots: { index: false, follow: false } };
export default function InventoryExceptionsPage() { return <AdminModuleEmptyScreen kind="exceptions" />; }
