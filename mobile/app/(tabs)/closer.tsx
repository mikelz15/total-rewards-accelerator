import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, type WealthProjection } from "@/lib/api";
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
import { SimpleBarChart } from "@/components/SimpleBarChart";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

const defaults = {
  candidate_name: "Alex Rivera",
  job_title: "Senior Compensation Partner",
  company_name: "Acme Health Systems",
  base_salary: "180000",
  target_bonus_pct: "15",
  lti_target_value: "300000",
  years_experience: "8",
  education: "Masters",
  required_education: "Bachelors",
  range_min: "140000",
  range_mid: "175000",
  range_max: "210000",
};

export default function CloserScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    role?: string;
    base?: string;
    bonus?: string;
    lti?: string;
  }>();
  const c = Colors[useColorScheme() ?? "light"];
  const [form, setForm] = useState(defaults);
  const [projection, setProjection] = useState<WealthProjection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      candidate_name: params.name || prev.candidate_name,
      job_title: params.role || prev.job_title,
      base_salary: params.base || prev.base_salary,
      target_bonus_pct: params.bonus || prev.target_bonus_pct,
      lti_target_value: params.lti || prev.lti_target_value,
    }));
  }, [params.name, params.role, params.base, params.bonus, params.lti]);

  function update(key: keyof typeof defaults, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function project() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        candidate_name: form.candidate_name,
        job_title: form.job_title,
        company_name: form.company_name,
        base_salary: Number(form.base_salary),
        target_bonus_pct: Number(form.target_bonus_pct),
        lti_target_value: Number(form.lti_target_value),
        years: 4,
        salary_growth_rate: 0.03,
        lti_vest_years: 4,
        years_experience: Number(form.years_experience),
        education: form.education,
        required_education: form.required_education,
        range_min: Number(form.range_min),
        range_mid: Number(form.range_mid),
        range_max: Number(form.range_max),
        use_recommended_base: false,
      };
      setProjection(await api.closerProject(payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Projection failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [
    styles.input,
    { borderColor: c.border, color: c.text, backgroundColor: c.card },
  ];

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Eyebrow>Module 04</Eyebrow>
        <Title>Candidate Closer</Title>
        <Subtitle>Four-year total wealth — sample persona for public demo.</Subtitle>

        <Banner tone="warn">
          Sample / synthetic offers only. Do not enter real candidate compensation.
        </Banner>

        <Card>
          <Field label="Candidate" value={form.candidate_name} onChange={(v) => update("candidate_name", v)} style={inputStyle} />
          <Field label="Role" value={form.job_title} onChange={(v) => update("job_title", v)} style={inputStyle} />
          <Field label="Base salary" value={form.base_salary} onChange={(v) => update("base_salary", v)} style={inputStyle} keyboardType="numeric" />
          <Field label="Bonus %" value={form.target_bonus_pct} onChange={(v) => update("target_bonus_pct", v)} style={inputStyle} keyboardType="numeric" />
          <Field label="LTI $" value={form.lti_target_value} onChange={(v) => update("lti_target_value", v)} style={inputStyle} keyboardType="numeric" />
          <Field label="YOE" value={form.years_experience} onChange={(v) => update("years_experience", v)} style={inputStyle} keyboardType="numeric" />
        </Card>

        <Button
          title={loading ? "Projecting…" : "Project total wealth"}
          onPress={project}
          loading={loading}
          variant="secondary"
        />
        <ErrorText>{error}</ErrorText>

        {projection && (
          <>
            <View style={styles.statRow}>
              <Stat label="Year-1 total" value={money(projection.summary.year_1_total)} tone="good" />
              <Stat label="4-year total" value={money(projection.grand_total)} />
            </View>
            {projection.placement?.expected_rate != null && (
              <View style={styles.statRow}>
                <Stat
                  label="Expected rate"
                  value={money(projection.placement.expected_rate)}
                  tone="good"
                />
                <Stat
                  label="Placement gap"
                  value={money(projection.placement.placement_gap)}
                  tone={(projection.placement.placement_gap ?? 0) > 0 ? "bad" : "good"}
                />
              </View>
            )}
            <Card>
              <Text style={[styles.cardTitle, { color: c.text }]}>Year totals</Text>
              <SimpleBarChart
                data={projection.timeline.map((t) => ({
                  label: `Y${t.year}`,
                  value: t.year_total,
                  color: c.tint,
                }))}
                formatValue={(n) => money(n)}
              />
            </Card>

            <Card>
              <Text style={[styles.cardTitle, { color: c.text }]}>Cumulative wealth</Text>
              <SimpleBarChart
                data={projection.timeline.map((t) => ({
                  label: `Y${t.year}`,
                  value: t.cumulative,
                  color: "#0f172a",
                }))}
                formatValue={(n) => money(n)}
              />
            </Card>

            <Card>
              <Text style={[styles.cardTitle, { color: c.text }]}>Year by year</Text>
              {projection.timeline.map((t) => (
                <Text key={t.year} style={{ color: c.textMuted, fontSize: 13, marginTop: 6 }}>
                  Y{t.year}: {money(t.year_total)} · cum {money(t.cumulative)}
                  {" · "}base {money(t.base)} · bonus {money(t.bonus)} · LTI {money(t.vesting)}
                </Text>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  style,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  style: object[];
  keyboardType?: "numeric" | "default";
}) {
  const c = Colors[useColorScheme() ?? "light"];
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: c.textSubtle, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={style}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  statRow: { flexDirection: "row", gap: 8 },
  cardTitle: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
});
