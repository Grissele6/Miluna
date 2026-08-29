import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StarryBackground from '../components/StarryBackground';
import OrbitCycle from '../components/OrbitCycle';
import BabyGrowth from '../components/BabyGrowth';
import { Card } from '../components/UI';
import { colors, spacing, typography, radius } from '../theme';
import { listPeriods } from '../db/repositories';
import { buildPrediction, pregnancyProbability } from '../utils/cyclePredictions';
import { copyFor, PROBABILITY_DISCLAIMER } from '../utils/stageContent';
import { useUser } from '../contexts/UserContext';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { fmtLong, toISODate } from '../utils/dateHelpers';
import { buildPregnancyState } from '../utils/pregnancy';

export default function HomeScreen({ navigation }) {
  const { stage, settings } = useUser();
  const copy = copyFor(stage);
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
  const today = toISODate(new Date());
  const probability = pregnancyProbability(today, periods, prediction);
  const pregnancy = useMemo(
    () => (stage === 'embarazo' ? buildPregnancyState(settings.pregnancy_lmp) : null),
    [stage, settings.pregnancy_lmp]
  );

  const daysToNext = prediction.nextPeriodStart
    ? differenceInCalendarDays(parseISO(prediction.nextPeriodStart), new Date())
    : null;

  const isSeeking = stage === 'buscando';

  return (
    <StarryBackground seed={2}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.brand}>MILUNA</Text>
          <Text style={styles.slogan}>Mi luna, mi ciclo, mi universo</Text>
        </View>

        {stage === 'embarazo' && <PregnancyHero pregnancy={pregnancy} />}

        <Text style={typography.h2}>{copy.welcome}</Text>
        <Text style={[typography.bodyDim, { marginTop: 4 }]}>{copy.homeSubtitle}</Text>

        {stage !== 'embarazo' && (
          <>
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

            {isSeeking && prediction.fertileWindow && (
              <Card style={styles.fertileCard}>
                <Text style={typography.h3}>Ventana fértil estimada</Text>
                <Text style={[typography.body, { marginTop: 4 }]}>
                  {fmtLong(parseISO(prediction.fertileWindow.start))} — {fmtLong(parseISO(prediction.fertileWindow.end))}
                </Text>
                <Text style={[typography.bodyDim, { marginTop: 4 }]}>
                  Ovulación estimada: {fmtLong(parseISO(prediction.ovulationDay))}
                </Text>
              </Card>
            )}

            {probability && (
              <Card style={styles.card}>
                <View style={styles.probRow}>
                  <ProbabilityBadge level={probability} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={typography.h3}>Probabilidad de embarazo hoy</Text>
                    <Text style={typography.caption}>{PROBABILITY_DISCLAIMER}</Text>
                  </View>
                </View>
              </Card>
            )}
          </>
        )}

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

function PregnancyHero({ pregnancy }) {
  if (!pregnancy) {
    return (
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={typography.h3}>Semana de gestación</Text>
        <Text style={[typography.bodyDim, { marginTop: 4 }]}>
          Configura la fecha de tu última regla en Ajustes para ver el progreso.
        </Text>
      </Card>
    );
  }
  const { week, daysIntoWeek, dueDate, fruit, trimester } = pregnancy;
  return (
    <Card style={styles.pregHero}>
      <View style={{ alignItems: 'center' }}>
        <BabyGrowth week={week} size={140} />
        <Text style={styles.weekBig}>Semana {week}{daysIntoWeek ? ` + ${daysIntoWeek}d` : ''}</Text>
        <Text style={styles.trimester}>Trimestre {trimester}</Text>
        {fruit && (
          <Text style={styles.fruitLine}>
            {fruit.emoji}  Tu bebé es del tamaño de {fruit.name} (~{fruit.sizeCm} cm).
          </Text>
        )}
        <Text style={styles.due}>Fecha estimada de parto: {dueDate}</Text>
      </View>
    </Card>
  );
}

function ProbabilityBadge({ level }) {
  const colorMap = {
    baja: colors.success,
    media: colors.warning,
    alta: colors.danger,
  };
  const labelMap = {
    baja: 'BAJA',
    media: 'MEDIA',
    alta: 'ALTA',
  };
  const c = colorMap[level] || colors.textDim;
  return (
    <View style={[styles.badge, { borderColor: c }]}>
      <Text style={[styles.badgeText, { color: c }]}>{labelMap[level] || '—'}</Text>
    </View>
  );
}

function QuickAction({ emoji, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.75 }]}>
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
  card: { marginTop: spacing.md },
  fertileCard: {
    marginTop: spacing.md,
    borderColor: colors.blueSoft,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  pregHero: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  weekBig: { color: colors.purpleSoft, fontSize: 32, fontWeight: '800', marginTop: spacing.sm },
  trimester: { color: colors.textDim, marginTop: 2, fontSize: 12, letterSpacing: 1 },
  fruitLine: { color: colors.text, marginTop: spacing.md, fontSize: 16, textAlign: 'center' },
  due: { color: colors.textDim, marginTop: spacing.sm, fontSize: 12 },
  probRow: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    borderWidth: 2,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  badgeText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
