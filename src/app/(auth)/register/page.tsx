import { RegisterForm } from "@/features/identity/auth-forms";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <RegisterForm nextPath={Array.isArray(next) ? next[0] : next} />;
}
