import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../theme';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateStars(seed, count, w, h) {
  const rnd = seededRandom(seed);
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rnd() * w,
      y: rnd() * h,
      r: rnd() < 0.85 ? 0.6 + rnd() * 0.8 : 1.4 + rnd() * 0.8,
      o: 0.35 + rnd() * 0.55,
    });
  }
  return stars;
}

export default function StarryBackground({ children, seed = 3, density = 0.0005 }) {
  const { width, height } = Dimensions.get('window');
  const stars = useMemo(
    () => generateStars(seed, Math.floor(width * height * density), width, height),
    [seed, width, height, density]
  );
  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="#1B0F3E" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#0A0524" stopOpacity="0.9" />
            <Stop offset="100%" stopColor={colors.bg} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#glow)" />
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={colors.starWhite} opacity={s.o} />
        ))}
      </Svg>
      <View style={styles.children}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  children: { flex: 1 },
});
