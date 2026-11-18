import type { ProductSummary } from "./w2-catalog";

/** Screen SE-08: filtering is explicitly limited to the *loaded* API pages. */
export const productStatusTabs = [
  { id:"all", label:"All" },
  { id:"draft", label:"Drafts" },
  { id:"changes", label:"Changes requested" },
  { id:"review", label:"In review" },
  { id:"approved", label:"Approved" },
  { id:"live", label:"Live" },
  { id:"restricted", label:"Restricted" },
] as const;
export type ProductTab = (typeof productStatusTabs)[number]["id"];

export function productMatchesTab(state: ProductSummary["publicationState"], tab: ProductTab): boolean {
  switch (tab) {
    case "all": return true;
    case "draft": return state === "DRAFT" || state === "INCOMPLETE";
    case "changes": return state === "REJECTED";
    case "review": return state === "PENDING_REVIEW" || state === "RE_REVIEW";
    case "approved": return state === "APPROVED";
    case "live": return state === "PUBLISHED";
    case "restricted": return state === "RESTRICTED";
  }
}

export function filteredLoadedProducts(products: readonly ProductSummary[], query: string, tab: ProductTab): ProductSummary[] {
  const text = query.trim().toLocaleLowerCase();
  return products.filter(product => productMatchesTab(product.publicationState, tab) && (!text || product.title.toLocaleLowerCase().includes(text) || product.styleCode.toLocaleLowerCase().includes(text)));
}

export function loadedTabCount(products: readonly ProductSummary[], tab: ProductTab): number {
  return products.reduce((count, product) => count + Number(productMatchesTab(product.publicationState, tab)), 0);
}
