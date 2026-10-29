"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { saasApi, type DatasetSummary, type GovernanceLibrary, type MeResponse } from "@/lib/saas-api";
import { SeatDashboard } from "@/components/SeatDashboard";

export default function AppDashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [offerCount, setOfferCount] = useState<number | null>(null);
  const [governance, setGovernance] = useState<GovernanceLibrary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const [profile, ds, cand, rules] = await Promise.all([
          saasApi.me(token),
          saasApi.listDatasets(token).catch(() => ({ datasets: [] as DatasetSummary[] })),
          saasApi.listCandidates(token).catch(() => ({ candidates: [] as unknown[], summary: {} })),
          saasApi.governance(token).catch(() => null),
        ]);
        if (!cancelled) {
          setMe(profile);
          setDatasets(ds.datasets);
          setCandidateCount(cand.candidates?.length ?? 0);
          const byStage = (cand.summary as { by_stage?: Record<string, number> } | undefined)?.by_stage;
          const offers = (byStage?.offer ?? 0) + (byStage?.accepted ?? 0);
          setOfferCount(byStage ? offers : null);
          setGovernance(rules);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SeatDashboard
      me={me}
      loading={loading}
      datasets={datasets}
      candidateCount={candidateCount}
      offerCount={offerCount}
      governance={governance}
    />
  );
}
