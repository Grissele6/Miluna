import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography } from '../theme';

export default function WeightChart({ data }) {
  const width = Math.min(360, Dimensions.get('window').width - spacing.md * 4);
  const height = 160;
  const pad = { l: 32, r: 12, t: 12, b: 20 };

  if (!data || data.length === 0) {
    return (
      <Text style={typography.bodyDim}>
        Aún no hay peso registrado. Anótalo en "Hoy" cuando te sirva verlo en el tiempo.
      </Text>
    );
  }

  const values = data.map((d) => d.weightKg);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = Math.max(0.5, max - min);
  const n = data.length;
  const xStep = (width - pad.l - pad.r) / Math.max(1, n - 1);

  const points = data.map((d, i) => {
    const x = pad.l + i * xStep;
    const y = pad.t + (height - pad.t - pad.b) * (1 - (d.weightKg - min) / range);
    return { x, y, v: d.weightKg, date: d.date };
  });

  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        <Line x1={pad.l} y1={height - pad.b} x2={width - pad.r} y2={height - pad.b} stroke={colors.border} strokeWidth={1} />
        <SvgText x={4} y={pad.t + 8} fontSize={10} fill={colors.textFaint}>
          {max.toFixed(1)}
        </SvgText>
        <SvgText x={4} y={height - pad.b + 4} fontSize={10} fill={colors.textFaint}>
          {min.toFixed(1)}
        </SvgText>
        <Polyline points={polyPoints} fill="none" stroke={colors.purpleSoft} strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.purple} />
        ))}
        <SvgText x={pad.l} y={height - 4} fontSize={9} fill={colors.textFaint}>
          {data[0].date}
        </SvgText>
        <SvgText x={width - pad.r} y={height - 4} fontSize={9} fill={colors.textFaint} textAnchor="end">
          {data[n - 1].date}
        </SvgText>
      </Svg>
      <Text style={styles.caption}>
        {n} registro{n === 1 ? '' : 's'} · último: {values[n - 1]} kg
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { color: colors.textFaint, fontSize: 11, marginTop: 4, textAlign: 'center' },
});
