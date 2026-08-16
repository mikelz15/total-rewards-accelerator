import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
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
import { useAuth } from "@/lib/auth-context";
import { canUseModule, type ModuleId } from "@/lib/saas-api";

const modules: {
  href: string;
  step: string;
  title: string;
  blurb: string;
  module: ModuleId;
}[] = [
  {
    href: "/cleaner",
    step: "01",
    title: "Market Data Cleaner",
    blurb: "Messy HRIS -> analysis-ready. Shared Placement Engine (YOE + education).",
    module: "cleaner",
  },
  {
    href: "/auditor",
    step: "02",
    title: "Equity + Merit",
    blurb: "Dual-lens equity, flight risk, merit pool remediation.",
    module: "equity",
  },
  {
    href: "/candidates",
    step: "03",
    title: "Candidate Tracker",
    blurb: "Pipeline stages and offer packages - hand off to Closer.",
    module: "tracker",
  },
  {
    href: "/closer",
    step: "04",
    title: "Candidate Closer",
    blurb: "Base / bonus / LTI -> four-year total wealth projection.",
    module: "closer",
  },
];

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { mode, setMode, session, me, permissions, signOut, supabaseReady } = useAuth();
  const [apiStatus, setApiStatus] = useState("checking...");
  const [saasOn, setSaasOn] = useState<boolean | null>(null);
  const [pushHint, setPushHint] = useState("not registered");
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    api
      .health()
      .then((h: { status: string; version?: string; saas?: { enabled?: boolean } }) => {
        setApiStatus(h.status === "ok" ? `ok · ${h.version || "api"}` : "degraded");
        setSaasOn(Boolean(h.saas?.enabled));
      })
      .catch(() => {
        setApiStatus("offline");
        setSaasOn(null);
      });
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
          "Remote push needs a physical device + EAS project."
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
          Dual mode: public demo (sample data) or signed-in workspace (org entitlements).
        </Subtitle>

        <Card>
          <Text style={[styles.metaLabel, { color: c.textSubtle }]}>MODE</Text>
          <View style={styles.row}>
            <Button
              title="Demo"
              variant={mode === "demo" ? "primary" : "ghost"}
              onPress={() => setMode("demo")}
            />
            <View style={{ width: 8 }} />
            <Button
              title="Workspace"
              variant={mode === "workspace" ? "primary" : "ghost"}
              onPress={() => {
                if (!session) {
                  Alert.alert("Sign in required", "Open Workspace sign-in to use org data.");
                }
                setMode("workspace");
              }}
            />
          </View>
          <Text style={[styles.metaHint, { color: c.textMuted, marginTop: 10 }]}>
            {mode === "demo"
              ? "Using public sample API (same guardrails as the website demo)."
              : session
                ? `Signed in as ${me?.user.email || "user"} · plan ${me?.org.plan || "—"} · role ${me?.membership.role || "—"}`
                : "Workspace mode — sign in to load org data."}
          </Text>
          <View style={{ height: 10 }} />
          {session ? (
            <Button title="Sign out" variant="ghost" onPress={() => void signOut()} />
          ) : (
            <Link href="/login" asChild>
              <Button title={supabaseReady ? "Sign in to workspace" : "Sign in (configure Supabase)"} />
            </Link>
          )}
        </Card>

        <Banner tone={mode === "demo" ? "info" : "warn"}>
          {mode === "demo"
            ? "Demo guardrails: sample-first Cleaner, PHI scan, row caps. Tracker/Closer are sample-oriented on the public API."
            : "Workspace mode uses /api/v1 with plan + role locks (same as web). Billing & full team admin stay on the website for now."}
        </Banner>

        <Card>
          <Text style={[styles.metaLabel, { color: c.textSubtle }]}>API</Text>
          <Text style={[styles.metaValue, { color: c.text }]}>{apiStatus}</Text>
          <Text style={[styles.metaHint, { color: c.textMuted }]} numberOfLines={2}>
            {API_BASE}
            {saasOn === true ? " · SaaS on" : saasOn === false ? " · SaaS off" : ""}
          </Text>
          {me?.permissions && mode === "workspace" && (
            <Text style={[styles.metaHint, { color: c.textMuted, marginTop: 6 }]}>
              Modules: {(me.permissions.modules || []).join(", ") || "none"}
            </Text>
          )}
        </Card>

        <Text style={[styles.section, { color: c.textSubtle }]}>MODULES</Text>
        {modules.map((m) => {
          const locked =
            mode === "workspace" && session
              ? !canUseModule(permissions, m.module)
              : false;
          return (
            <Link key={m.href} href={m.href as any} asChild>
              <Card style={styles.moduleCard}>
                <Text style={[styles.step, { color: c.textSubtle }]}>
                  {m.step}
                  {locked ? " · LOCKED" : ""}
                </Text>
                <Text style={[styles.moduleTitle, { color: c.text }]}>{m.title}</Text>
                <Body>{m.blurb}</Body>
                <Text style={[styles.open, { color: locked ? c.textMuted : c.tint }]}>
                  {locked ? "View lock reason -&gt;" : "Open -&gt;"}
                </Text>
              </Card>
            </Link>
          );
        })}

        <Card>
          <Text style={[styles.moduleTitle, { color: c.text }]}>Web for billing & team</Text>
          <Body>
            Purchase licenses, invite teammates, and run platform admin on the website. Mobile stays
            focused on field demo + module workflows.
          </Body>
          <View style={{ height: 10 }} />
          <Button
            title="Open web workspace"
            variant="secondary"
            onPress={() => void Linking.openURL("https://totalrewardsaccelerator.com/app")}
          />
        </Card>

        <Text style={[styles.section, { color: c.textSubtle }]}>PILOT NOTIFICATIONS</Text>
        <Card>
          <Body>
            Design-partner reminders. Status: {pushHint}
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
  row: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, alignItems: "center" },
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
