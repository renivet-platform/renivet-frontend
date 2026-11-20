export type ImportConflictMessage = { title: string; explanation: string; nextStep: string; code: string };

const knownConflicts: Record<string, Omit<ImportConflictMessage, "code">> = {
  CATEGORY_UNMAPPED: {
    title: "Category not matched",
    explanation: "The category in this file has not been linked to a Renivet category.",
    nextStep: "Go back to Match columns and add a source category mapping. The destination category must be available to this brand.",
  },
  PRICE_REVIEW_REQUIRED: {
    title: "Price needs approval",
    explanation: "The imported price requires review before the product can proceed.",
    nextStep: "Check the price in your file. The authorised price reviewer must approve it through the normal review process.",
  },
  ATTRIBUTE_NOT_IN_SCHEMA: {
    title: "Product option is not allowed",
    explanation: "A product option, such as colour or size, is not configured for the selected category.",
    nextStep: "Check the category and its permitted options. Correct the mapping or ask an authorised category manager to configure the option.",
  },
  SKU_CONFLICT: {
    title: "SKU already exists",
    explanation: "The imported SKU conflicts with an existing record.",
    nextStep: "Review the matching product and choose the appropriate import mode. Do not create duplicate SKUs.",
  },
  PRODUCT_NOT_FOUND: {
    title: "Product was not found",
    explanation: "This row references a product that could not be matched.",
    nextStep: "Check the source product identifier and SKU, then rebuild the preview.",
  },
  INVALID_PRICE: {
    title: "Invalid price",
    explanation: "The price is missing or does not meet the import validation rules.",
    nextStep: "Correct the price in your source file, upload it again and rebuild the preview.",
  },
};

export function importConflictMessage(code: string): ImportConflictMessage {
  const match = knownConflicts[code];
  if (match) return { ...match, code };
  return {
    code,
    title: "Import needs review",
    explanation: "This row triggered a validation or review condition.",
    nextStep: "Check the row and its source mappings. Share the technical code with support if you need help.",
  };
}

export function uniqueImportConflicts(codes: readonly string[]): Array<{ message: ImportConflictMessage; occurrences: number }> {
  const counts = new Map<string, number>();
  for (const code of codes) counts.set(code, (counts.get(code) ?? 0) + 1);
  return [...counts].map(([code, occurrences]) => ({ message: importConflictMessage(code), occurrences }));
}
