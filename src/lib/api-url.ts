/** Resolve a non-secret, browser-safe API base URL. */
export function resolveApiBaseUrl(input: string | undefined): string {
  const candidate = input?.trim() || "http://localhost:4000/api/v1";
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("API base URL must use http or https.");
  }
  return url.toString().replace(/\/$/, "");
}
