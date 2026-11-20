export type ImportConflictMessage = { title: string; explanation: string; nextStep: string; code: string };

const knownConflicts: Record<string, Omit<ImportConflictMessage, "code">> = {
  IMPORT_REQUIRED_FIELD: {
    title: "Product identity is incomplete",
    explanation: "This source row needs a product name, SKU and product style identifier. For Unicommerce, Renivet uses externalItemId (or skuCode if missing); for Shopify, it uses URL handle.",
    nextStep: "For a fresh import, select the matching source system and keep its default field mapping. If this still appears, check that the SKU and name columns contain values.",
  },
  IMPORT_VARIANTS_NEED_EDITING: {
    title: "Product saved; variant details to complete",
    explanation: "The original SKU, colour and size are saved in the import. The category does not currently allow a valid variant combination, so the private product draft may not yet contain that variant.",
    nextStep: "No need to upload the source again. Finish the category's options and create the variant when the product is ready.",
  },
  CATEGORY_UNMAPPED: {
    title: "Category not matched",
    explanation: "The category in this file has not been linked to a Renivet category.",
    nextStep: "Go back to Match columns and add a source category mapping. The destination category must be available to this brand.",
  },
  PRICE_REVIEW_REQUIRED: {
    title: "Source price saved",
    explanation: "The source price is retained with the imported record; it is not an import error.",
    nextStep: "No price approval is required to save this import. Set up a valid live price before publishing or selling this product.",
  },
  ATTRIBUTE_VALUE_INVALID: {
    title: "Category option needs editing",
    explanation: "A value in the imported product options does not match the currently allowed category values. The original entry is still saved.",
    nextStep: "You can save the import now. Before using the product as a catalog draft, check its size, colour, or other option against the category details.",
  },
  MEDIA_REVIEW_REQUIRED: {
    title: "Source image reference saved",
    explanation: "The image link was retained from the source file, but it is not yet an approved Renivet media asset.",
    nextStep: "No approval is needed to save this import. Upload or verify usable images before publishing the product.",
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

function humanizeCode(code: string): string {
  const words = code.trim().replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLowerCase();
  if (!words) return "An import issue occurred";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function importConflictMessage(code: string): ImportConflictMessage {
  const match = knownConflicts[code];
  if (match) return { ...match, code };
  return {
    code,
    title: humanizeCode(code),
    explanation: "The import system flagged this row with the issue shown above. More specific details were not supplied.",
    nextStep: "The source row can still be saved privately. Check its mappings and edit the catalog fields later, before publication. If you need help, share the technical code with support.",
  };
}

export function uniqueImportConflicts(codes: readonly string[]): Array<{ message: ImportConflictMessage; occurrences: number }> {
  const counts = new Map<string, number>();
  for (const code of codes) counts.set(code, (counts.get(code) ?? 0) + 1);
  return [...counts].map(([code, occurrences]) => ({ message: importConflictMessage(code), occurrences }));
}
