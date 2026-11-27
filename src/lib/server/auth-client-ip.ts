import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/** Only enable on a verified DigitalOcean ingress that replaces the client IP header. */
export function signedClientIp(request: Request, path: string, key: string | undefined, trustDigitalOcean: boolean, now = Date.now()): string | undefined {
  if (!trustDigitalOcean || !key || key.length < 32) return undefined;
  const ip = request.headers.get("do-connecting-ip")?.trim();
  if (!ip || !isIP(ip) || ip.includes("%")) return undefined;
  const timestamp = String(Math.floor(now / 1000));
  const signature = createHmac("sha256", key).update(`v1\n${path}\n${timestamp}\n${ip}`).digest("hex");
  return `v1;${timestamp};${ip};${signature}`;
}
