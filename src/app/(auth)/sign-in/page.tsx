import { SignInForm } from "@/features/identity/auth-forms";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <SignInForm nextPath={Array.isArray(next) ? next[0] : next} />;
}
