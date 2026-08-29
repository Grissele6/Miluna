import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StarryBackground from '../components/StarryBackground';
import OrbitCycle from '../components/OrbitCycle';
import { Card } from '../components/UI';
import { colors, spacing, typography } from '../theme';
import { listPeriods } from '../db/repositories';
import { buildPrediction } from '../utils/cyclePredictions';
import { copyFor } from '../utils/stageContent';
import { useUser } from '../contexts/UserContext';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { fmtLong } from '../utils/dateHelpers';

export default function HomeScreen({ navigation }) {
  const { stage } = useUser();
  const [periods, setPeriods] = useState([]);

  const load = useCallback(async () => {
    setPeriods(await listPeriods());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const prediction = useMemo(() => buildPrediction(periods), [periods]);
  const copy = copyFor(stage);

  const daysToNext = prediction.nextPeriodStart
    ? differenceInCalendarDays(parseISO(prediction.nextPeriodStart), new Date())
    : null;

  return (
    <StarryBackground seed={2}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.brand}>MILUNA</Text>
          <Text style={styles.slogan}>Mi luna, mi ciclo, mi universo</Text>
        </View>

        <Text style={typography.h2}>{copy.welcome}</Text>
        <Text style={[typography.bodyDim, { marginTop: 4 }]}>{copy.homeSubtitle}</Text>

        <Card style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <OrbitCycle
            cycleLength={prediction.averages.cycleLength}
            cycleDay={prediction.cycleDay}
            periodLength={prediction.averages.periodLength}
            ovulationDay={Math.max(1, prediction.averages.cycleLength - 14)}
            fertileRange={[
              Math.max(1, prediction.averages.cycleLength - 14 - 5),
              Math.min(prediction.averages.cycleLength, prediction.averages.cycleLength - 14 + 1),
            ]}
          />
          <Text style={styles.headline}>
            {daysToNext === null
              ? 'Marca tu primera regla para empezar tu universo.'
              : daysToNext <= 0
              ? 'Tu regla se estima para hoy o estos días.'
              : `Faltan ${daysToNext} día${daysToNext === 1 ? '' : 's'} para tu próxima regla.`}
          </Text>
          {prediction.nextPeriodStart && (
            <Text style={styles.sub}>Estimada: {fmtLong(parseISO(prediction.nextPeriodStart))}</Text>
          )}
        </Card>

        <View style={styles.quickRow}>
          <QuickAction emoji="📅" label="Calendario" onPress={() => navigation.navigate('CalendarTab')} />
          <QuickAction emoji="💜" label="Hoy" onPress={() => navigation.navigate('DailyTab')} />
          <QuickAction emoji="✨" label="Mi universo" onPress={() => navigation.navigate('UniverseTab')} />
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.h3}>Cada cuerpo es distinto</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            Miluna aprende de TI. Mientras más registras, más se ajustan las predicciones a tu propio
            ritmo. Ningún ciclo "correcto" existe — solo el tuyo.
          </Text>
        </Card>
      </ScrollView>
    </StarryBackground>
  );
}

function QuickAction({ emoji, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quick, pressed && { opacity: 0.75 }]}
    >
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  brand: { fontSize: 32, fontWeight: '800', color: colors.purpleSoft, letterSpacing: 5 },
  slogan: { color: colors.textDim, marginTop: 2, fontStyle: 'italic', fontSize: 12 },
  headline: { color: colors.text, textAlign: 'center', marginTop: spacing.md, fontSize: 16, fontWeight: '600' },
  sub: { color: colors.textDim, textAlign: 'center', marginTop: 4, fontSize: 12 },
  quickRow: { flexDirection: 'row', marginTop: spacing.md, justifyContent: 'space-between' },
  quick: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  quickEmoji: { fontSize: 24 },
  quickLabel: { color: colors.text, marginTop: 6, fontSize: 12, fontWeight: '600' },
});
