import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import Colors from "@/constants/Colors";
import { useColorScheme } from "./useColorScheme";

export type BarDatum = {
  label: string;
  value: number;
  color?: string;
};

/**
 * Lightweight bar chart for Equity / Closer (no heavy chart SDK).
 */
export function SimpleBarChart({
  data,
  height = 180,
  formatValue,
}: {
  data: BarDatum[];
  height?: number;
  formatValue?: (n: number) => string;
}) {
  const c = Colors[useColorScheme() ?? "light"];
  const { width: screenW } = useWindowDimensions();
  const width = Math.min(screenW - 64, 360);
  const padL = 8;
  const padB = 28;
  const padT = 12;
  const chartH = height - padB - padT;
  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = 8;
  const barW = data.length
    ? (width - padL * 2 - gap * (data.length - 1)) / data.length
    : 0;

  if (!data.length) {
    return (
      <View style={[styles.empty, { borderColor: c.border }]}>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>No chart data</Text>
      </View>
    );
  }

  return (
    <View>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const h = (d.value / max) * chartH;
          const x = padL + i * (barW + gap);
          const y = padT + chartH - h;
          return (
            <Rect
              key={d.label}
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 2)}
              rx={6}
              fill={d.color || c.tint}
            />
          );
        })}
        {data.map((d, i) => {
          const x = padL + i * (barW + gap) + barW / 2;
          return (
            <SvgText
              key={`l-${d.label}`}
              x={x}
              y={height - 8}
              fontSize="10"
              fill={c.textSubtle}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
      {formatValue && (
        <View style={styles.legend}>
          {data.map((d) => (
            <Text key={d.label} style={{ color: c.textMuted, fontSize: 11 }}>
              {d.label}: {formatValue(d.value)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  legend: { gap: 2, marginTop: 4 },
});
