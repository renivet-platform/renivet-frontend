export type AdminReviewQueue = "taxonomy" | "quality" | "pricing" | "claims" | "publishing";

const queues = new Set<AdminReviewQueue>(["taxonomy", "quality", "pricing", "claims", "publishing"]);

export function isQueueId(value: string): value is AdminReviewQueue {
  return queues.has(value as AdminReviewQueue);
}

export function reviewQueuePath(queue: AdminReviewQueue, id?: string): string {
  return id ? `/operations/${queue}/${encodeURIComponent(id)}` : `/operations/${queue}`;
}
