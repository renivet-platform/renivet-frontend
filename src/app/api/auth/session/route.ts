import { proxyAuthRequest } from "@/lib/server/auth-proxy";

export const dynamic = "force-dynamic";

export function GET(request: Request): Promise<Response> {
  return proxyAuthRequest(request, "/auth/session", "GET");
}

export function DELETE(request: Request): Promise<Response> {
  return proxyAuthRequest(request, "/auth/session", "DELETE");
}
