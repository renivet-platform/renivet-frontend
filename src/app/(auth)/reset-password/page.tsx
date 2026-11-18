import type { Metadata } from "next";
import { RecoveryForm } from "@/features/identity/auth-forms";

export const metadata: Metadata = { title: "Choose a new password | Renivet" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <RecoveryForm nextPath={Array.isArray(next) ? next[0] : next} screenId="CU-09D" />;
}
