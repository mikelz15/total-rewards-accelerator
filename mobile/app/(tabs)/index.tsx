import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { api, API_BASE } from "@/lib/api";
import {
  Banner,
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Subtitle,
  Title,
} from "@/components/ui";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import {
  getStoredPushToken,
  registerForPushNotifications,
  schedulePilotLocalReminder,
} from "@/lib/notifications";

const modules = [
  {
    href: "/cleaner",
    step: "01",
    title: "Market Data Cleaner",
    blurb: "Messy HRIS -> analysis-ready. Shared Placement Engine (YOE + education).",
  },
  {
    href: "/auditor",
    step: "02",
    title: "Equity + Merit",
    blurb: "Dual-lens equity, flight risk, merit pool remediation.",
  },
  {
    href: "/candidates",
    step: "03",
    title: "Candidate Tracker",
    blurb: "Pipeline stages and offer packages - hand off to Closer.",
  },
  {
    href: "/closer",
    step: "04",
    title: "Candidate Closer",
    blurb: "Base / bonus / LTI -> four-year total wealth projection.",
  },
];

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const [apiStatus, setApiStatus] = useState("checking...");
  const [pushHint, setPushHint] = useState("not registered");
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    api
      .health()
      .then((h) => setApiStatus(h.status === "ok" ? `ok · ${h.version || "api"}` : "degraded"))
      .catch(() => setApiStatus("offline"));
    getStoredPushToken().then((t) => {
      if (t) setPushHint(`token ...${t.slice(-8)}`);
    });
  }, []);

  const enablePush = useCallback(async () => {
    setPushLoading(true);
    try {
      const token = await registerForPushNotifications();
      if (token) {
        setPushHint(`token ...${token.slice(-8)}`);
        Alert.alert("Push enabled", "Expo push token saved on device for pilot demos.");
      } else {
        setPushHint("permission denied or simulator");
        Alert.alert(
          "Local reminders still work",
          "Remote push needs a physical device + EAS project. You can still test a local pilot reminder."
        );
      }
    } catch (e) {
      Alert.alert("Push setup", e instanceof Error ? e.message : "Failed");
    } finally {
      setPushLoading(false);
    }
  }, []);

  const testLocalReminder = useCallback(async () => {
    setPushLoading(true);
    try {
      await schedulePilotLocalReminder(5);
      Alert.alert("Scheduled", "Pilot reminder in ~5 seconds (local notification).");
    } catch (e) {
      Alert.alert("Reminder failed", e instanceof Error ? e.message : "Error");
    } finally {
      setPushLoading(false);
    }
  }, []);

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>Total Rewards Accelerator · Mobile</Eyebrow>
        <Title>Stop crunching rows. Start designing strategy.</Title>
        <Subtitle>
          Comp Engineering toolkit - Cleaner, Equity + Merit, Tracker, and Closer on the go.
        </Subtitle>

        <Banner tone="info">
          Demo guardrails apply: sample-first Cleaner, PHI header scan, row caps. Tracker/Closer are
          sample-oriented on the public API.
        </Banner>

        <Card>
          <Text style={[styles.metaLabel, { color: c.textSubtle }]}>API</Text>
          <Text style={[styles.metaValue, { color: c.text }]}>{apiStatus}</Text>
          <Text style={[styles.metaHint, { color: c.textMuted }]} numberOfLines={2}>
            {API_BASE}
          </Text>
        </Card>

        <Text style={[styles.section, { color: c.textSubtle }]}>MODULES</Text>
        {modules.map((m) => (
          <Link key={m.href} href={m.href as any} asChild>
            <Card style={styles.moduleCard}>
              <Text style={[styles.step, { color: c.textSubtle }]}>{m.step}</Text>
              <Text style={[styles.moduleTitle, { color: c.text }]}>{m.title}</Text>
              <Body>{m.blurb}</Body>
              <Text style={[styles.open, { color: c.tint }]}>Open -&gt;</Text>
            </Card>
          </Link>
        ))}

        <Card>
          <Text style={[styles.moduleTitle, { color: c.text }]}>Why this is different</Text>
          <Body>
            Three-click speed · Placement Engine (YOE + education) · Four-year total wealth ·
            Defendable equity remediation
          </Body>
        </Card>

        <Text style={[styles.section, { color: c.textSubtle }]}>PILOT NOTIFICATIONS</Text>
        <Card>
          <Body>
            Design-partner reminders (merit cycle walkthrough, demo follow-up). Status: {pushHint}
          </Body>
          <View style={{ height: 10 }} />
          <Button
            title="Enable push permissions"
            onPress={enablePush}
            loading={pushLoading}
            variant="ghost"
          />
          <View style={{ height: 8 }} />
          <Button
            title="Test local reminder (5s)"
            onPress={testLocalReminder}
            loading={pushLoading}
            variant="secondary"
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  metaLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  metaValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  metaHint: { fontSize: 11, marginTop: 4 },
  section: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 8,
  },
  moduleCard: { marginBottom: 10 },
  step: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  moduleTitle: { fontSize: 17, fontWeight: "700", marginTop: 4, marginBottom: 4 },
  open: { marginTop: 10, fontWeight: "600", fontSize: 14 },
});
