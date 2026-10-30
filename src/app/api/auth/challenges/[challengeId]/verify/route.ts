import { isValidChallengeId, proxyAuthRequest } from "@/lib/server/auth-proxy";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ challengeId: string }> },
): Promise<Response> {
  const { challengeId } = await context.params;
  if (!isValidChallengeId(challengeId)) {
    return Response.json(
      { code: "AUTH_INPUT_INVALID", message: "The request could not be processed." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return proxyAuthRequest(request, `/auth/challenges/${challengeId}/verify`, "POST");
}
