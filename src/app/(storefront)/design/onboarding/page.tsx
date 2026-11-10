import type { Metadata } from "next";
import { OnboardingPrototype } from "@/features/identity/onboarding-prototype-view";

export const metadata: Metadata = {
  title: "Identity & seller access preview | Renivet",
  description: "Provisional W1 identity and seller access design preview.",
  robots: { index: false, follow: false },
};

export default function OnboardingDesignPage() {
  return <OnboardingPrototype />;
}
