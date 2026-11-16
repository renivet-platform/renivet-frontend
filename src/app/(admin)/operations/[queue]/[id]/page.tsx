import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminOperationsConsole } from "@/features/admin/operations-console";
import { isQueueId } from "@/features/admin/admin-route-utils";

export const metadata: Metadata = { title: "Review detail | Renivet", robots: { index: false, follow: false } };

export default async function ReviewDetailPage({ params }: { params: Promise<{ queue: string; id: string }> }) {
  const { queue, id } = await params;
  if (!isQueueId(queue) || !id) notFound();
  return <AdminOperationsConsole initialQueue={queue} initialItemId={decodeURIComponent(id)} />;
}
