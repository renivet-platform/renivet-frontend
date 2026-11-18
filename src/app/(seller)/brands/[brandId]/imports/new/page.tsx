import { notFound } from "next/navigation";
import { ImportWorkspace } from "@/features/seller/import-workspace";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";
export const metadata = { title: "New import | Renivet", robots: { index:false, follow:false } };
export default async function NewBrandImport({params}:{params:Promise<{brandId:string}>}) {
 const {brandId}=await params;const state=resolveBrandWorkspaceRoute(brandId,w2PortalEnabled());
 if(state==="not-found") notFound();
 if(state==="unavailable") return <WorkspaceUnavailable section="product import"/>;
 return <ImportWorkspace brandId={brandId}/>;
}