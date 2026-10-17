import { NextResponse } from "next/server";
import { resolveApiBaseUrl } from "@/lib/api-url";

export const dynamic = "force-dynamic";

// Host-local and staging-safe server-side bridge; browser never needs backend credentials.
export async function GET() {
  try {
    const base = resolveApiBaseUrl(
      process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL
    );
    const response = await fetch(`${base}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error("Backend unavailable");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("status" in result) || result.status !== "ok") {
      throw new Error("Unexpected backend response");
    }
    return NextResponse.json({ status: "ok", backend: "ok" });
  } catch {
    return NextResponse.json(
      { status: "unavailable", backend: "unavailable" },
      { status: 503 }
    );
  }
}
