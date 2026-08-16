"use client";

import { createContext, useContext } from "react";
import type { MeResponse } from "@/lib/saas-api";
import type { Permissions } from "@/lib/permissions";

export type WorkspaceState = {
  me: MeResponse | null;
  permissions: Permissions | null;
  error: string | null;
  reload: () => void;
};

export const WorkspaceContext = createContext<WorkspaceState>({
  me: null,
  permissions: null,
  error: null,
  reload: () => undefined,
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
