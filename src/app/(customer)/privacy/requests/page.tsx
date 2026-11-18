import type { Metadata } from "next";
import { PrivacyRequestsScreen } from "@/features/identity/privacy-prototype";

export const metadata: Metadata = { title: "Data requests | Renivet" };
export default function PrivacyRequestsPage() { return <PrivacyRequestsScreen />; }
