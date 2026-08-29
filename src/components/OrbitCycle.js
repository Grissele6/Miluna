import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, {
  Circle,
  G,
  Path,
  Defs,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../theme';

/**
 * Visualize the current cycle as a lunar orbit.
 *   size            overall canvas size
 *   cycleLength     total days in cycle (e.g. 28)
 *   cycleDay        current day within cycle (1-based) or null
 *   periodLength    days of period at cycle start
 *   ovulationDay    day-of-cycle where ovulation happens (e.g. 14)
 *   fertileRange    [startDay, endDay] inclusive within cycle
 */
export default function OrbitCycle({
  size = 260,
  cycleLength = 28,
  cycleDay = null,
  periodLength = 5,
  ovulationDay = 14,
  fertileRange = [9, 15],
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;

  const dayToAngle = (d) => ((d - 1) / cycleLength) * 2 * Math.PI - Math.PI / 2;
  const pointOnOrbit = (d) => ({
    x: cx + radius * Math.cos(dayToAngle(d)),
    y: cy + radius * Math.sin(dayToAngle(d)),
  });

  const arcPath = (fromDay, toDay) => {
    const start = pointOnOrbit(fromDay);
    const end = pointOnOrbit(toDay + 1);
    const large =
      (((toDay + 1 - fromDay) / cycleLength) * 360) % 360 > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const nowPt = cycleDay ? pointOnOrbit(cycleDay) : null;
  const ovulPt = pointOnOrbit(ovulationDay);

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="core" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.purpleSoft} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={colors.bg} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {/* Core glow */}
        <Circle cx={cx} cy={cy} r={radius * 0.7} fill="url(#core)" />
        {/* Base orbit */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.border}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="2 4"
        />
        {/* Period arc */}
        <Path d={arcPath(1, periodLength)} stroke={colors.purple} strokeWidth={5} fill="none" strokeLinecap="round" />
        {/* Fertile arc */}
        <Path
          d={arcPath(fertileRange[0], fertileRange[1])}
          stroke={colors.blueSoft}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />
        {/* Ovulation marker */}
        <Circle cx={ovulPt.x} cy={ovulPt.y} r={6} fill={colors.starWhite} />
        {/* Current day marker */}
        {nowPt ? (
          <G>
            <Circle cx={nowPt.x} cy={nowPt.y} r={12} fill={colors.purpleSoft} opacity={0.35} />
            <Circle cx={nowPt.x} cy={nowPt.y} r={7} fill={colors.purple} stroke={colors.starWhite} strokeWidth={1.5} />
          </G>
        ) : null}
        {/* Center text */}
        <SvgText x={cx} y={cy - 4} fontSize={13} fill={colors.textDim} textAnchor="middle">
          Día
        </SvgText>
        <SvgText x={cx} y={cy + 22} fontSize={28} fontWeight="700" fill={colors.text} textAnchor="middle">
          {cycleDay ?? '—'}
        </SvgText>
        <SvgText x={cx} y={cy + 40} fontSize={11} fill={colors.textFaint} textAnchor="middle">
          de {cycleLength}
        </SvgText>
      </Svg>

      <View style={styles.legend}>
        <LegendDot color={colors.purple} label="Regla" />
        <LegendDot color={colors.blueSoft} label="Días fértiles" />
        <LegendDot color={colors.starWhite} label="Ovulación" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  legend: { flexDirection: 'row', marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendLabel: { color: colors.textDim, fontSize: 12 },
});
