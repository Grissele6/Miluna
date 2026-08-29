import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Easing } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Path, G } from 'react-native-svg';
import StarryBackground from '../components/StarryBackground';
import { colors, spacing, typography, radius } from '../theme';
import { pickPhrase } from '../utils/phrases';
import { useUser } from '../contexts/UserContext';

function Logo({ size = 108 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="lglow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.purpleSoft} stopOpacity="0.45" />
          <Stop offset="100%" stopColor={colors.bg} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={size / 2} fill="url(#lglow)" />
      {/* Crescent: full moon with offset cutout */}
      <G>
        <Circle cx={cx} cy={cy} r={r} fill={colors.purple} />
        <Circle cx={cx + r * 0.35} cy={cy - r * 0.05} r={r * 0.92} fill={colors.bg} />
      </G>
      {/* Sparkle near the tip */}
      <Path
        d={`M ${cx + r * 0.5} ${cy - r * 0.6} l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 z`}
        fill={colors.starWhite}
      />
    </Svg>
  );
}

export default function WelcomeScreen({ onEnter }) {
  const { stage } = useUser();
  const phrase = useMemo(() => pickPhrase(stage), [stage]);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <StarryBackground seed={42} twinklers={30}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={{ alignItems: 'center' }}>
          <Logo />
          <Text style={styles.brand}>MILUNA</Text>
          <Text style={styles.slogan}>Mi luna, mi ciclo, mi universo</Text>
        </View>

        <View style={styles.phraseWrap}>
          <Text style={styles.phrase}>“{phrase}”</Text>
        </View>

        <Pressable
          onPress={onEnter}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.ctaText}>Explorar mi universo</Text>
        </Pressable>
      </Animated.View>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.purpleSoft,
    letterSpacing: 8,
    marginTop: spacing.md,
  },
  slogan: {
    color: colors.textDim,
    marginTop: 6,
    fontStyle: 'italic',
    fontSize: 14,
  },
  phraseWrap: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  phrase: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '500',
  },
  cta: {
    backgroundColor: colors.purple,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    minWidth: 240,
    alignItems: 'center',
    shadowColor: colors.purple,
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  ctaText: {
    ...typography.button,
    color: '#fff',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
