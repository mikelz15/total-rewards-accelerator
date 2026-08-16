import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api, type CandidateList } from "@/lib/api";
import { money } from "@/lib/format";
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
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function CandidatesScreen() {
  const router = useRouter();
  const c = Colors[useColorScheme() ?? "light"];
  const [data, setData] = useState<CandidateList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.candidatesList());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <ModuleLock module="tracker">
    <Screen style={{ padding: 0 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={c.tint} />
        }
      >
        <Eyebrow>Module 03</Eyebrow>
        <Title>Candidate Tracker</Title>
        <Subtitle>Sample recruiting pipeline — open an offer in Closer.</Subtitle>

        <Banner tone="info">
          Public demo: synthetic pipeline only. Create/delete may be disabled on the API.
        </Banner>

        {data && (
          <View style={styles.statRow}>
            <Stat label="Total" value={String(data.summary.total)} />
            <Stat label="Open" value={String(data.summary.open_pipeline)} tone="good" />
          </View>
        )}
        <ErrorText>{error}</ErrorText>

        {(data?.candidates || []).map((cand) => (
          <Card key={cand.id}>
            <Text style={[styles.name, { color: c.text }]}>{cand.name}</Text>
            <Text style={{ color: c.textMuted, fontSize: 14 }}>{cand.role}</Text>
            <Text style={{ color: c.textSubtle, fontSize: 12, marginTop: 4 }}>
              {cand.stage} · {money(cand.base_salary)} · {cand.target_bonus_pct}% bonus
            </Text>
            <View style={{ marginTop: 10 }}>
              <Button
                title="Open in Closer →"
                variant="ghost"
                onPress={() =>
                  router.push({
                    pathname: "/closer",
                    params: {
                      name: cand.name,
                      role: cand.role,
                      base: String(cand.base_salary),
                      bonus: String(cand.target_bonus_pct),
                      lti: String(cand.lti_target_value),
                    },
                  })
                }
              />
            </View>
          </Card>
        ))}

        {!loading && !data?.candidates?.length && !error && (
          <Card>
            <Text style={{ color: c.textMuted }}>No candidates loaded.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
    </ModuleLock>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  statRow: { flexDirection: "row", gap: 8 },
  name: { fontSize: 16, fontWeight: "700" },
});
