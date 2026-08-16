import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { api, type AuditResult, type RemediationResult } from "@/lib/api";
import { money, ratio } from "@/lib/format";
import { loadCleanResult, saveCleanResult } from "@/lib/session";
import {
  Banner,
  Button,
  Card,
  ErrorText,
  Eyebrow,
  Screen,
  Stat,
  Subtitle,
  Title,
} from "@/components/ui";
import { ModuleLock } from "@/components/ModuleLock";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function AuditorScreen() {
  const c = Colors[useColorScheme() ?? "light"];
  const [hasClean, setHasClean] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [remediation, setRemediation] = useState<RemediationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCleanResult().then((r) => setHasClean(!!r?.records?.length));
  }, []);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRemediation(null);
    try {
      let records = (await loadCleanResult())?.records;
      if (!records?.length) {
        const clean = await api.cleanerSample();
        await saveCleanResult(clean);
        records = clean.records;
        setHasClean(true);
      }
      const data = await api.auditorRun(records, 5);
      setAudit(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const runMerit = useCallback(async () => {
    if (!audit?.employees?.length) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.remediationRun({
        records: audit.employees,
        merit_pool: 250000,
        target_compa: 1.0,
        underpaid_only: true,
        target_mode: "expected_placement",
      });
      setRemediation(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remediation failed");
    } finally {
      setLoading(false);
    }
  }, [audit]);

  return (
    <ModuleLock module="equity">
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>Module 02</Eyebrow>
        <Title>Equity + Merit</Title>
        <Subtitle>
          Dual-lens equity, flight risk, and merit pool toward expected placement.
        </Subtitle>

        {!hasClean && (
          <Banner tone="info">
            No cleaned session yet — Run audit will load the sample HRIS automatically.
          </Banner>
        )}

        <Button
          title={loading ? "Working…" : "Run equity + flight risk"}
          onPress={runAudit}
          loading={loading}
          variant="secondary"
        />
        <ErrorText>{error}</ErrorText>

        {audit && (
          <>
            <View style={styles.statRow}>
              <Stat label="Employees" value={String(audit.summary.total)} />
              <Stat label="Underpaid" value={String(audit.summary.underpaid)} tone="warn" />
            </View>
            <View style={styles.statRow}>
              <Stat
                label="Avg compa"
                value={ratio(audit.summary.avg_compa_ratio)}
              />
              <Stat
                label="Gap to parity"
                value={money(audit.summary.total_gap_to_parity)}
                tone="bad"
              />
            </View>

            {audit.flight_risk_summary && (
              <View style={styles.statRow}>
                <Stat
                  label="High flight risk"
                  value={String(
                    (audit.flight_risk_summary.high || 0) +
                      (audit.flight_risk_summary.critical || 0)
                  )}
                  tone="warn"
                />
                <Stat
                  label="Avg risk score"
                  value={
                    audit.flight_risk_summary.avg_flight_risk != null
                      ? String(Math.round(audit.flight_risk_summary.avg_flight_risk))
                      : "—"
                  }
                />
              </View>
            )}

            <Card>
              <Text style={[styles.cardTitle, { color: c.text }]}>Equity mix</Text>
              <SimpleBarChart
                data={[
                  {
                    label: "Under",
                    value: audit.summary.underpaid,
                    color: "#f59e0b",
                  },
                  {
                    label: "At mkt",
                    value: audit.summary.at_market,
                    color: c.tint,
                  },
                  {
                    label: "Over",
                    value: audit.summary.overpaid,
                    color: "#64748b",
                  },
                ]}
              />
            </Card>

            {audit.flight_risk_summary && (
              <Card>
                <Text style={[styles.cardTitle, { color: c.text }]}>Flight risk bands</Text>
                <SimpleBarChart
                  data={[
                    {
                      label: "Crit",
                      value: audit.flight_risk_summary.critical || 0,
                      color: "#e11d48",
                    },
                    {
                      label: "High",
                      value: audit.flight_risk_summary.high || 0,
                      color: "#f59e0b",
                    },
                    {
                      label: "Med",
                      value: audit.flight_risk_summary.moderate || 0,
                      color: "#0ea5e9",
                    },
                    {
                      label: "Low",
                      value: audit.flight_risk_summary.low || 0,
                      color: c.tint,
                    },
                  ]}
                />
              </Card>
            )}

            <Card>
              <Text style={[styles.cardTitle, { color: c.text }]}>Top raise targets</Text>
              {(audit.top_raise_targets || []).slice(0, 5).map((t, i) => (
                <Text key={i} style={{ color: c.textMuted, fontSize: 13, marginTop: 6 }}>
                  {String(t.name || t.employee_id || "Employee")} · gap{" "}
                  {money(Number(t.gap_to_mid ?? t.recommended_increase ?? 0))}
                </Text>
              ))}
            </Card>

            <Button
              title={loading ? "Allocating…" : "Fund merit toward expected placement"}
              onPress={runMerit}
              loading={loading}
            />
          </>
        )}

        {remediation && (
          <View style={styles.statRow}>
            <Stat label="Allocated" value={money(remediation.summary.allocated)} tone="good" />
            <Stat
              label="People funded"
              value={String(remediation.summary.employees_funded)}
              tone="good"
            />
          </View>
        )}
      </ScrollView>
    </Screen>
    </ModuleLock>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  statRow: { flexDirection: "row", gap: 8 },
  cardTitle: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
});
