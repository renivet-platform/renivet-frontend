import type { components } from "@/generated/renivet-api";

export type Category = components["schemas"]["CategorySummaryDto"];
export type CategoryAttribute = components["schemas"]["AttributeDefinitionDto"];
export type ProductSummary = components["schemas"]["ProductSummaryModel"];

export interface Paged<T> { items: T[]; nextCursor?: string | null }
export interface ProductPage { items: ProductSummary[]; totalCount: number; nextCursor?: string | null }

export class W2ApiError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = "W2ApiError";
  }
}

function safeMessage(status: number): string {
  if (status === 401) return "Your session has expired. Sign in again, then reopen this workspace.";
  if (status === 403) return "You do not have permission to view or change this brand’s catalogue.";
  if (status === 404) return "This brand or product is not available.";
  if (status === 409) return "The product changed while you were working. Refresh and review the latest version.";
  if (status === 422) return "Some product details need attention. Review the fields and try again.";
  return "The catalogue service is temporarily unavailable. Try again shortly.";
}

export async function w2Request<T>(segments: string[], options: {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  csrfToken?: string;
  idempotencyKey?: string;
  ifMatch?: string;
  query?: Record<string, string>;
  signal?: AbortSignal;
} = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.csrfToken) headers.set("X-CSRF-Token", options.csrfToken);
  if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
  if (options.ifMatch) headers.set("If-Match", options.ifMatch);

  const search = new URLSearchParams(options.query);
  const url = `/api/w2/${segments.map(encodeURIComponent).join("/")}${search.size ? `?${search}` : ""}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      credentials: "same-origin",
      signal: options.signal,
    });
  } catch {
    throw new W2ApiError("W2_SERVICE_UNAVAILABLE", "The catalogue service could not be reached. Your unsaved form is still here.", 503);
  }

  if (response.status === 304) return undefined as T;
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new W2ApiError("W2_RESPONSE_INVALID", safeMessage(503), 503); }

  if (!response.ok) {
    const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const code = typeof record.code === "string" && /^[A-Z0-9_]{1,80}$/.test(record.code) ? record.code : "W2_REQUEST_FAILED";
    const message = typeof record.message === "string" && record.message.length <= 300 ? record.message : safeMessage(response.status);
    throw new W2ApiError(code, message, response.status);
  }
  return body as T;
}

export function selectableCategories(categories: Category[]): Category[] {
  return categories.filter((category) => category.isActive && category.isLeaf && Number.isSafeInteger(category.currentSchemaVersion)
    && category.currentSchemaVersion >= 1);
}

export function categoryLabel(category: Category, categories: Category[]): string {
  const byCode = new Map(categories.map((item) => [item.code, item.name]));
  const path = category.pathCodes?.length ? category.pathCodes : [category.code];
  return path.map((code) => byCode.get(code) ?? code).join(" › ");
}

export function categoryDraftVersion(category: Category): number {
  return category.currentSchemaVersion;
}

export function canonicalVariantOptions(options: Record<string, string>): string {
  return JSON.stringify(Object.fromEntries(Object.entries(options).sort(([left], [right]) => left.localeCompare(right))));
}

export function hasVariantCombination(options: Record<string, string>, variants: Array<{ id?: string; options: Record<string, string>; variantState: string }>, exceptVariantId?: string): boolean {
  const signature = canonicalVariantOptions(options);
  return variants.some((variant) => (!exceptVariantId || variant.id !== exceptVariantId) && variant.variantState !== "INACTIVE" && canonicalVariantOptions(variant.options) === signature);
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}
