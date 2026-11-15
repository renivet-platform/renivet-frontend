import type { Metadata } from "next";
import { TaxonomyAdminWorkspace } from "@/features/admin/taxonomy-admin";

export const metadata: Metadata = { title: "Taxonomy administration | Renivet" };

export default function TaxonomyPage() {
  return <TaxonomyAdminWorkspace />;
}
