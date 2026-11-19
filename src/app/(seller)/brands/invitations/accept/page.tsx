import type { Metadata } from "next";
import { BrandInvitationAcceptance } from "@/features/seller/brand-invitation-acceptance";
export const metadata: Metadata = { title: "Accept brand team invitation | Renivet", robots: { index:false, follow:false } };
export default async function AcceptBrandInvitation({ searchParams }: {
  searchParams: Promise<{brandId?:string;token?:string}>
}) {
  const {brandId="",token=""}=await searchParams;
  return <BrandInvitationAcceptance brandId={brandId} token={token}/>;
}
