import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import { api, type CleanResult } from "@/lib/api";
import { money } from "@/lib/format";
import { saveCleanResult } from "@/lib/session";
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
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function CleanerScreen() {
  const router = useRouter();
  const c = Colors[useColorScheme() ?? "light"];
  const [result, setResult] = useState<CleanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const applyResult = useCallback(async (data: CleanResult) => {
    setResult(data);
    await saveCleanResult(data);
  }, []);

  const loadSample = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUploadName(null);
    try {
      await applyResult(await api.cleanerSample());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clean failed");
    } finally {
      setLoading(false);
    }
  }, [applyResult]);

  const pickAndUpload = useCallback(async () => {
    setError(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/tab-separated-values",
          "text/plain",
          "public.comma-separated-values-text",
          "*/*",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]) return;

      const asset = picked.assets[0];
      setLoading(true);
      setUploadName(asset.name);

      // Prefer multipart upload (matches web); fall back to reading text + paste
      try {
        const data = await api.cleanerUpload({
          uri: asset.uri,
          name: asset.name || "upload.csv",
          mimeType: asset.mimeType,
        });
        await applyResult(data);
      } catch {
        const text = await readAsStringAsync(asset.uri);
        if (!text.trim()) throw new Error("File is empty");
        const data = await api.cleanerPaste(text);
        await applyResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }, [applyResult]);

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSample} tintColor={c.tint} />
        }
      >
        <Eyebrow>Module 01</Eyebrow>
        <Title>Market Data Cleaner</Title>
        <Subtitle>
          Load the messy HRIS sample or pick a CSV/TSV from your device. Shared Placement Engine
          runs on clean.
        </Subtitle>

        <Banner tone="warn">
          Public demo: prefer sample data. Custom files are capped (≤10 rows) and scanned for
          sensitive headers on the API.
        </Banner>

        <Button
          title={loading ? "Cleaning…" : "Load messy HRIS sample"}
          onPress={loadSample}
          loading={loading}
          variant="secondary"
        />
        <Button
          title={loading ? "Uploading…" : "Upload CSV / TSV"}
          onPress={pickAndUpload}
          loading={loading}
          variant="ghost"
        />
        {uploadName ? (
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Last file: {uploadName}</Text>
        ) : null}
        <ErrorText>{error}</ErrorText>

        {result && (
          <>
            <View style={styles.statRow}>
              <Stat
                label="Rows in → out"
                value={`${result.stats.rows_in} → ${result.stats.rows_out}`}
              />
              <Stat
                label="Quality"
                value={String(result.stats.quality_score ?? "—")}
                tone={(result.stats.quality_score ?? 0) >= 70 ? "good" : "warn"}
              />
            </View>
            <View style={styles.statRow}>
              <Stat
                label="Below expected"
                value={String(result.stats.placement?.below_expected ?? "—")}
                tone="warn"
              />
              <Stat
                label="Placement gap"
                value={
                  result.stats.placement?.total_placement_gap != null
                    ? money(result.stats.placement.total_placement_gap)
                    : "—"
                }
                tone="warn"
              />
            </View>

            <Card>
              <Text style={[styles.cardTitle, { color: c.text }]}>Column mapping</Text>
              {Object.entries(result.stats.columns_mapped)
                .slice(0, 8)
                .map(([from, to]) => (
                  <Text key={from} style={{ color: c.textMuted, fontSize: 13, marginTop: 4 }}>
                    {from} → {to}
                  </Text>
                ))}
            </Card>

            <Button title="Send to Equity + Merit →" onPress={() => router.push("/auditor")} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  statRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  cardTitle: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
});
