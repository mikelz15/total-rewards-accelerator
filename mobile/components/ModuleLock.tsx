import { View, Text, StyleSheet, Linking } from "react-native";
import { Link } from "expo-router";
import { Body, Button, Card, Title } from "@/components/ui";
import type { ModuleId } from "@/lib/saas-api";
import { canUseModule } from "@/lib/saas-api";
import { useAuth } from "@/lib/auth-context";

const LABELS: Record<ModuleId, string> = {
  cleaner: "Cleaner",
  equity: "Equity + Merit",
  tracker: "Candidates",
  closer: "Closer",
};

export function ModuleLock({
  module,
  children,
}: {
  module: ModuleId;
  children: React.ReactNode;
}) {
  const { mode, permissions, session } = useAuth();

  // Demo mode: always allow public sample API screens
  if (mode === "demo") return <>{children}</>;

  // Workspace mode without session
  if (!session) {
    return (
      <View style={styles.wrap}>
        <Card>
          <Title>Workspace required</Title>
          <Body style={{ marginTop: 8 }}>
            Sign in to use org data and entitlements, or switch Home to Demo mode for sample data.
          </Body>
          <Link href="/login" asChild>
            <Button title="Sign in" style={{ marginTop: 12 }} />
          </Link>
        </Card>
      </View>
    );
  }

  if (canUseModule(permissions, module)) return <>{children}</>;

  const planHas = permissions?.plan_modules?.includes(module);
  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.eyebrow}>
          {permissions?.suspended ? "Suspended" : planHas ? "Role restricted" : "Upgrade"}
        </Text>
        <Title>{LABELS[module]} locked</Title>
        <Body style={{ marginTop: 8 }}>
          {permissions?.suspended
            ? "This organization is suspended."
            : planHas
              ? `Your role (${permissions?.role}) cannot open this module.`
              : `Plan “${permissions?.plan || "—"}” does not include ${LABELS[module]}. Manage billing on the web app.`}
        </Body>
        <View style={{ height: 12 }} />
        <Button
          title="Open billing (web)"
          variant="ghost"
          onPress={() => void Linking.openURL("https://totalrewardsaccelerator.com/app/billing")}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: "center" },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#b45309",
    marginBottom: 6,
  },
});
