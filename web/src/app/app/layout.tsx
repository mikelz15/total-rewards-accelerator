"use client";

import { WorkspaceFrame } from "@/components/WorkspaceFrame";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
