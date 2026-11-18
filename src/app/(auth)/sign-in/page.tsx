import { SignInForm } from "@/features/identity/auth-forms";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const nextPath = Array.isArray(next) ? next[0] : next;
  return <SignInForm nextPath={nextPath} screenId={nextPath?.startsWith("/operations") ? "AD-01" : "CU-08"} />;
}
