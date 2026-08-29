import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../theme';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Fixed "far" starfield rendered once via SVG — no per-frame cost.
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

// A small twinkling star powered by the native driver.
function Twinkler({ x, y, size, seed }) {
  const anim = useRef(new Animated.Value(seed % 1)).current;
  useEffect(() => {
    const dur = 1800 + (seed * 1000) % 2600;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, seed]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.95] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.starWhite,
        opacity,
      }}
    />
  );
}

export default function StarryBackground({ children, seed = 3, density = 0.0005, twinklers = 22 }) {
  const { width, height } = Dimensions.get('window');
  const stars = useMemo(
    () => generateStars(seed, Math.floor(width * height * density), width, height),
    [seed, width, height, density]
  );
  const twinks = useMemo(() => {
    const rnd = seededRandom(seed + 999);
    return Array.from({ length: twinklers }).map((_, i) => ({
      x: rnd() * width,
      y: rnd() * height,
      size: 1.4 + rnd() * 2.6,
      seed: i + seed,
    }));
  }, [seed, width, height, twinklers]);

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
      {/* Twinklers — a small handful of native-driven fades. Cheap on the JS thread. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {twinks.map((t) => (
          <Twinkler key={t.seed} x={t.x} y={t.y} size={t.size} seed={t.seed} />
        ))}
      </View>
      <View style={styles.children}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  children: { flex: 1 },
});
