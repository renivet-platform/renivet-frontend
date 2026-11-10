import { proxyW2Request } from "@/lib/server/w2-proxy";

type RouteContext = { params: Promise<{ segments: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { segments } = await context.params;
  return proxyW2Request(request, segments);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
