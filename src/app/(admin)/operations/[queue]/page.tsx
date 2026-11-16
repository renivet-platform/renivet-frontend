import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminOperationsConsole } from "@/features/admin/operations-console";
import { isQueueId } from "@/features/admin/admin-route-utils";

export const metadata: Metadata = { title: "Review queue | Renivet", robots: { index: false, follow: false } };

export default async function ReviewQueuePage({ params }: { params: Promise<{ queue: string }> }) {
  const { queue } = await params;
  if (!isQueueId(queue)) notFound();
  return <AdminOperationsConsole initialQueue={queue} />;
}
