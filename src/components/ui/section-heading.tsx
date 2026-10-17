import type { ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  return <h1 className="text-4xl font-semibold">{children}</h1>;
}
