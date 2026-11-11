import { W2ApiError } from "@/features/seller/w2-catalog";

export interface ImportMappingEntry { source: string; target: string }

export function validateImportFieldMappings(rows: ImportMappingEntry[]): string | null {
  const active = rows.filter((row) => row.source.trim() && row.target);
  if (active.length === 0) return "Map at least one source column.";
  const sources = active.map((row) => row.source.trim().toLocaleLowerCase("en-US"));
  if (new Set(sources).size !== sources.length) return "Each source column can be mapped only once.";
  const targets = active.map((row) => row.target);
  if (new Set(targets).size !== targets.length) return "Each Renivet destination field can be mapped only once.";
  if (rows.some((row) => row.source.trim() && !row.target)) return "Choose a destination or remove each mapped source column.";
  return null;
}

export function isStaleImportPreview(error: unknown): boolean {
  return error instanceof W2ApiError && error.code === "PREVIEW_STALE";
}
