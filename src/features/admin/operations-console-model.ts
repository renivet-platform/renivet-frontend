export type AdminOperationAreaId = "overview" | "taxonomy" | "quality" | "pricing" | "claims" | "publishing";

export interface AdminOperationArea {
  id: AdminOperationAreaId;
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  availability: string;
  apiStatus: "Preview only" | "Partial API" | "No review API" | "Decision API only" | "No API route";
  registeredRoutes: readonly string[];
  actionAvailable: false;
  gates: string[];
}

export const adminOperationAreas: readonly AdminOperationArea[] = [
  {
    id: "overview",
    index: "00",
    eyebrow: "CONTROL ROOM",
    title: "Review work, with context.",
    description: "A focused place for platform operations to examine catalog changes, evidence, and the exact revision under review.",
    availability: "No counts or protected queue data are loaded on this preview page.",
    apiStatus: "Preview only",
    registeredRoutes: [],
    actionAvailable: false,
    gates: ["No protected data loaded"],
  },
  {
    id: "taxonomy",
    index: "01",
    eyebrow: "GLOBAL TAXONOMY",
    title: "Category changes",
    description: "Compare a proposed schema with the published version before an independent administrator publishes it.",
    availability: "Draft and publish endpoints are registered, but the category list and safe revision read are missing, so reviewers cannot select a category and inspect its diff safely.",
    apiStatus: "Partial API",
    registeredRoutes: [
      "POST /api/v1/admin/catalog/categories/{categoryId}/schema-versions",
      "POST /api/v1/admin/catalog/categories/{categoryId}/schema-versions/{version}/publish",
    ],
    actionAvailable: false,
    gates: ["No admin category read context", "Fresh MFA required by backend"],
  },
  {
    id: "quality",
    index: "02",
    eyebrow: "QUALITY REVIEW",
    title: "Frozen product checks",
    description: "Inspect a frozen product revision, its validation evidence, and maker-checker history before deciding.",
    availability: "No registered QC queue, safe frozen-revision read, or decision route exists for frozen snapshots.",
    apiStatus: "No review API",
    registeredRoutes: [],
    actionAvailable: false,
    gates: ["QC queue unavailable", "Maker-checker evidence unavailable"],
  },
  {
    id: "pricing",
    index: "03",
    eyebrow: "PRICE GOVERNANCE",
    title: "Price proposals",
    description: "Review a pending price against its effective window and record an independent decision with audit context.",
    availability: "The price decision endpoint is registered, but the queue and safe proposal detail read are missing for pending proposals.",
    apiStatus: "Decision API only",
    registeredRoutes: ["POST /api/v1/admin/brands/{brandId}/variant-prices/{priceId}/decision"],
    actionAvailable: false,
    gates: ["No reviewer queue", "No safe proposal detail read"],
  },
  {
    id: "claims",
    index: "04",
    eyebrow: "CLAIM EVIDENCE",
    title: "Sustainability claims",
    description: "Review evidence eligibility and expiry for the exact product revision before making an independent decision.",
    availability: "The claim decision endpoint is registered, but the queue and safe evidence read are missing for reviewers.",
    apiStatus: "Decision API only",
    registeredRoutes: ["POST /api/v1/admin/brands/{brandId}/claims/{claimId}/decision"],
    actionAvailable: false,
    gates: ["No reviewer queue", "No safe evidence read"],
  },
  {
    id: "publishing",
    index: "05",
    eyebrow: "LISTING CONTROL",
    title: "Publication and restrictions",
    description: "Select the approved product revision explicitly and confirm any listing restriction with its audit context.",
    availability: "No registered publish or restriction route exists for revision selection and confirmation.",
    apiStatus: "No API route",
    registeredRoutes: [],
    actionAvailable: false,
    gates: ["No publish endpoint", "No restriction endpoint"],
  },
] as const;

export function adminOperationArea(id: AdminOperationAreaId): AdminOperationArea {
  const area = adminOperationAreas.find((item) => item.id === id);
  if (!area) throw new Error(`Unknown admin operation area: ${id}`);
  return area;
}
