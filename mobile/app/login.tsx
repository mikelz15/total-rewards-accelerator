import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { Body, Button, Card, Eyebrow, Screen, Title } from "@/components/ui";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function LoginScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const router = useRouter();
  const { signIn, signUp, supabaseReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert("Missing fields", "Enter email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "in") {
        await signIn(email.trim(), password);
        Alert.alert("Signed in", "Workspace mode is on. Modules use your org entitlements.");
      } else {
        const note = await signUp(email.trim(), password);
        Alert.alert("Account", note || "Signed up and signed in.");
      }
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Auth failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Workspace sign in" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Eyebrow>SaaS workspace</Eyebrow>
        <Title>Sign in to your org</Title>
        <View style={{ height: 8 }} />
        <Body>
          Same Supabase account as the web app. Public demo tabs still work without login.
        </Body>

        {!supabaseReady && (
          <Card style={{ marginTop: 16 }}>
            <Text style={{ color: c.muted, fontSize: 13 }}>
              Supabase keys are not baked into this build. Set EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY (or app.json extra) before a store build.
            </Text>
          </Card>
        )}

        <Card style={{ marginTop: 16, gap: 12 }}>
          <View style={styles.seg}>
            <Button
              title="Sign in"
              variant={mode === "in" ? "primary" : "ghost"}
              onPress={() => setMode("in")}
            />
            <View style={{ width: 8 }} />
            <Button
              title="Create account"
              variant={mode === "up" ? "primary" : "ghost"}
              onPress={() => setMode("up")}
            />
          </View>
          <Text style={[styles.label, { color: c.muted }]}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            placeholderTextColor={c.muted}
            style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
          />
          <Text style={[styles.label, { color: c.muted }]}>Password</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={c.muted}
            style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
          />
          <Button
            title={busy ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
            onPress={onSubmit}
            disabled={busy || !supabaseReady}
          />
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
});
