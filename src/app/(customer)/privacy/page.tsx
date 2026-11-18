import type { Metadata } from "next";
import { PrivacyPreferencesScreen } from "@/features/identity/privacy-prototype";

export const metadata: Metadata = { title: "Privacy and communication | Renivet" };
export default function PrivacyPreferencesPage() { return <PrivacyPreferencesScreen />; }
