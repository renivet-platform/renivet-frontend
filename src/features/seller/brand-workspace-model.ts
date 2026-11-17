export type ProductStateSummary = { loaded: number; live: number; inReview: number; needsAttention: number; drafts: number };

export function summarizeProducts(products: Array<{ publicationState: string }>): ProductStateSummary {
  return products.reduce<ProductStateSummary>((summary, product) => {
    summary.loaded += 1;
    if (product.publicationState === "PUBLISHED") summary.live += 1;
    if (product.publicationState === "PENDING_REVIEW" || product.publicationState === "RE_REVIEW") summary.inReview += 1;
    if (product.publicationState === "REJECTED" || product.publicationState === "RESTRICTED") summary.needsAttention += 1;
    if (product.publicationState === "DRAFT" || product.publicationState === "INCOMPLETE") summary.drafts += 1;
    return summary;
  }, { loaded: 0, live: 0, inReview: 0, needsAttention: 0, drafts: 0 });
}
