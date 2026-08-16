import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "./useColorScheme";

function useTheme() {
  const scheme = useColorScheme() ?? "light";
  return Colors[scheme];
}

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: c.background }, style]}>
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.card, borderColor: c.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return <Text style={[styles.title, { color: c.text }]}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return <Text style={[styles.subtitle, { color: c.textMuted }]}>{children}</Text>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return <Text style={[styles.eyebrow, { color: c.tint }]}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return <Text style={[styles.body, { color: c.textMuted }]}>{children}</Text>;
}

export function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const c = useTheme();
  const valueColor =
    tone === "good"
      ? c.good
      : tone === "warn"
        ? c.warn
        : tone === "bad"
          ? c.danger
          : c.text;
  return (
    <View style={[styles.stat, { backgroundColor: c.background }]}>
      <Text style={[styles.statLabel, { color: c.textSubtle }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  variant = "primary",
  loading,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  const c = useTheme();
  const bg =
    variant === "primary"
      ? c.primary
      : variant === "secondary"
        ? c.tint
        : "transparent";
  const color = variant === "ghost" ? c.tint : "#fff";
  const border =
    variant === "ghost" ? { borderWidth: 1, borderColor: c.border } : {};

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1 },
        border,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.btnText, { color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Banner({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warn";
}) {
  const bg = tone === "warn" ? "#fffbeb" : "#ecfeff";
  const border = tone === "warn" ? "#fde68a" : "#a5f3fc";
  const color = tone === "warn" ? "#92400e" : "#155e75";
  return (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: border }]}>
      <Text style={{ color, fontSize: 13, lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  if (!children) return null;
  return (
    <View style={[styles.errorBox, { backgroundColor: "#fff1f2" }]}>
      <Text style={{ color: c.danger, fontSize: 13 }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 6 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  body: { fontSize: 14, lineHeight: 20 },
  stat: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
    minWidth: "45%",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: { fontSize: 20, fontWeight: "700", marginTop: 4 },
  btn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  btnText: { fontSize: 15, fontWeight: "600" },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  errorBox: {
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
});
