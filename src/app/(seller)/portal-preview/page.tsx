import type { Metadata } from "next";
import { W2PortalDesignPreview } from "@/features/seller/w2-portal-design-preview";

export const metadata: Metadata = {
  title: "W2 brand workspace preview | Renivet",
  description: "A non-operational code preview for the W2 brand and admin portal handoff.",
  robots: { index: false, follow: false },
};

/** Static design handoff only. It renders no seller data and makes no API requests. */
export default function W2PortalPreviewPage() {
  return <W2PortalDesignPreview />;
}
