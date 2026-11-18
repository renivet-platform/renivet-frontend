import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default function OperationsLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell role="admin">{children}</WorkspaceShell>;
}
