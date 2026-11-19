const localMediaUploadHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isAllowedPrivateMediaUploadUrl(value: string, environment: string | undefined): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    if (url.protocol === "https:") return true;
    return environment === "development" && url.protocol === "http:" && localMediaUploadHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
