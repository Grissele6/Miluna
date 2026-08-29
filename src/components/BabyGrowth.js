import React from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { colors } from '../theme';
import { growthProgress } from '../utils/pregnancy';

/**
 * Minimal "growing pod" illustration: a soft glowing orb that scales with
 * gestational week. Intentionally abstract — not a fetus silhouette.
 */
export default function BabyGrowth({ week, size = 140 }) {
  const p = growthProgress(week);
  const radius = 12 + p * (size * 0.36 - 12);
  const cx = size / 2;
  const cy = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="pod" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.purpleSoft} stopOpacity="0.9" />
          <Stop offset="70%" stopColor={colors.purpleDeep} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={colors.bg} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.purpleSoft} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={colors.bg} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={radius + 22} fill="url(#halo)" />
      <Ellipse cx={cx} cy={cy} rx={radius} ry={radius * 0.9} fill="url(#pod)" />
      <Circle
        cx={cx - radius * 0.3}
        cy={cy - radius * 0.35}
        r={radius * 0.18}
        fill={colors.starWhite}
        opacity={0.55}
      />
    </Svg>
  );
}
