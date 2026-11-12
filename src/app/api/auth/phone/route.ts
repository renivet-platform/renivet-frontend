import { proxyAuthRequest } from "@/lib/server/auth-proxy";

export const dynamic = "force-dynamic";

export function POST(request: Request): Promise<Response> {
  return proxyAuthRequest(request, "/auth/phone", "POST");
}
