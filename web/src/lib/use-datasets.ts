"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken, saasApi, type DatasetSummary } from "@/lib/saas-api";
import { useWorkspace } from "@/lib/workspace-context";

export type SavedDatasets = {
  datasets: DatasetSummary[];
  /** True until the first list call settles. Do not show "No datasets yet" while true. */
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * Saved datasets for the signed-in org.
 *
 * Right after sign-in the page can mount before the browser session is ready,
 * so a one-shot fetch on mount sometimes failed and left "No datasets yet"
 * with Run disabled until a reload. This hook waits for the token, shows a
 * loading state, and fetches again once the workspace profile arrives if the
 * first try did not succeed.
 */
export function useSavedDatasets(): SavedDatasets {
  const { me } = useWorkspace();
  const orgId = me?.org.id ?? null;
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await saasApi.listDatasets(token);
      if (mine !== seq.current) return;
      setDatasets(res.datasets);
      setError(null);
      loaded.current = true;
    } catch (err) {
      if (mine !== seq.current) return;
      setError(err instanceof Error ? err.message : "Could not load datasets");
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      seq.current++;
    };
  }, [load]);

  // The workspace profile arriving means the session is ready. Retry then if
  // the first attempt failed (or the org changed).
  useEffect(() => {
    if (orgId && !loaded.current) void load();
  }, [orgId, load]);

  return { datasets, loading, error, reload: () => void load() };
}
