import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default function BrandLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell role="seller">{children}</WorkspaceShell>;
}
