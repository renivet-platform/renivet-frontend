const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PendingBrandApplicationRef = { brandId: string };

export function brandApprovalDetailPath(brandId: string): string | null {
  if (!uuidPattern.test(brandId)) return null;
  return `/brand-approvals/${brandId.toLowerCase()}`;
}

export function findPendingBrandApplication<T extends PendingBrandApplicationRef>(items: T[], brandId: string): T | null {
  if (!uuidPattern.test(brandId)) return null;
  const targetId = brandId.toLowerCase();
  return items.find((item) => uuidPattern.test(item.brandId) && item.brandId.toLowerCase() === targetId) ?? null;
}
