import { RecoveryForm } from "@/features/identity/auth-forms";

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <RecoveryForm nextPath={Array.isArray(next) ? next[0] : next} />;
}
