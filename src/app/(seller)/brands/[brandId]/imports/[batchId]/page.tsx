import { notFound } from "next/navigation";
import { ImportBatchResults } from "@/features/seller/import-list";
import { resolveBrandWorkspaceRoute } from "@/features/seller/workspace-route";
import { WorkspaceUnavailable } from "@/features/seller/workspace-unavailable";
import { w2PortalEnabled } from "@/lib/server/w2-proxy";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const metadata={title:"Import results | Renivet",robots:{index:false,follow:false}};
export default async function ImportResultsPage({params}:{params:Promise<{brandId:string;batchId:string}>}){
 const {brandId,batchId}=await params;const state=resolveBrandWorkspaceRoute(brandId,w2PortalEnabled());
 if(state==="not-found"||!uuid.test(batchId))notFound();
 if(state==="unavailable")return <WorkspaceUnavailable section="import results"/>;
 return <ImportBatchResults brandId={brandId} batchId={batchId}/>;
}