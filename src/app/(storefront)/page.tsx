import { PageContainer } from "@/components/layout/page-container";
import { FoundationStatus } from "@/components/shared/foundation-status";
import { SectionHeading } from "@/components/ui/section-heading";

export default function StorefrontHomePage() {
  return (
    <PageContainer>
      <p className="text-xs font-semibold uppercase tracking-[.25em]">Renivet</p>
      <SectionHeading>New platform foundation</SectionHeading>
      <p className="text-lg text-slate-700">
        This is an engineering bootstrap, not a launched marketplace.
        Checkout, seller accounts and payments are not enabled.
      </p>
      <FoundationStatus />
    </PageContainer>
  );
}
