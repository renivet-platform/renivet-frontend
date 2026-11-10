import type { Metadata } from "next";
import { W2ReviewPrototype } from "@/features/seller/w2-review-prototype-view";

export const metadata: Metadata = {
  title: "W2 brand onboarding design preview | Renivet",
  description: "Provisional W2 brand application and review design. Not an operational workflow.",
  robots: { index: false, follow: false },
};

export default function W2OnboardingDesignPage() {
  return <W2ReviewPrototype />;
}
