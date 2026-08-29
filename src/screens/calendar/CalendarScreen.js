import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import OrbitCycle from '../../components/OrbitCycle';
import { Card, PrimaryButton, GhostButton, SectionTitle } from '../../components/UI';
import { colors, spacing, typography, radius } from '../../theme';
import { addPeriod, listPeriods, removePeriod } from '../../db/repositories';
import { buildPrediction, classifyDate } from '../../utils/cyclePredictions';
import {
  toISODate,
  parseDate,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  fmtMonthYear,
  fmtLong,
} from '../../utils/dateHelpers';
import { CONTRACEPTIVE_DISCLAIMER, copyFor } from '../../utils/stageContent';
import { useUser } from '../../contexts/UserContext';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CalendarScreen() {
  const { stage } = useUser();
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [periods, setPeriods] = useState([]);
  const [selected, setSelected] = useState(toISODate(new Date()));

  const reload = useCallback(async () => setPeriods(await listPeriods()), []);
  useEffect(() => {
    reload();
  }, [reload]);

  const prediction = useMemo(() => buildPrediction(periods), [periods]);
  const copy = copyFor(stage);

  const days = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    const all = eachDayOfInterval({ start, end });
    // Pad to Monday-start
    const firstDow = (getDay(start) + 6) % 7;
    const padding = Array(firstDow).fill(null);
    return [...padding, ...all];
  }, [monthCursor]);

  const monthTotal = days.length;
  const trailing = (7 - (monthTotal % 7)) % 7;
  const grid = [...days, ...Array(trailing).fill(null)];

  const toggleSelectedAsPeriodStart = async () => {
    const iso = selected;
    const already = periods.find((p) => p.startDate === iso);
    if (already) {
      Alert.alert('Quitar día de regla', `Ya está marcado como inicio de regla. ¿Quitarlo?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            await removePeriod(iso);
            reload();
          },
        },
      ]);
      return;
    }
    await addPeriod(iso, iso);
    reload();
  };

  const extendPeriod = async () => {
    if (!periods.length) return;
    // find the most recent period whose start <= selected
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    let target = null;
    for (const p of sorted) {
      if (p.startDate <= selected) target = p;
    }
    if (!target) {
      Alert.alert('Marca primero el inicio', 'Toca el día en que empezó tu regla y luego "Marcar inicio de regla".');
      return;
    }
    const newEnd = selected >= target.startDate ? selected : target.startDate;
    await addPeriod(target.startDate, newEnd);
    reload();
  };

  const cycleDayForToday = prediction?.cycleDay ?? null;

  return (
    <StarryBackground seed={4}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>Mi calendario</Text>

        <Card style={{ alignItems: 'center' }}>
          <OrbitCycle
            cycleLength={prediction.averages.cycleLength}
            cycleDay={cycleDayForToday}
            periodLength={prediction.averages.periodLength}
            ovulationDay={prediction.averages.cycleLength - 14}
            fertileRange={[
              Math.max(1, prediction.averages.cycleLength - 14 - 5),
              Math.min(prediction.averages.cycleLength, prediction.averages.cycleLength - 14 + 1),
            ]}
          />
          <Text style={styles.predictionLine}>
            {prediction.nextPeriodStart
              ? `Próxima regla estimada: ${fmtLong(parseDate(prediction.nextPeriodStart))}`
              : 'Marca tu primera regla para empezar a predecir tu ciclo.'}
          </Text>
          <Text style={styles.caveat}>{copy.predictionCaveat}</Text>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.monthHeader}>
            <Pressable onPress={() => setMonthCursor(addDays(monthCursor, -30))} hitSlop={12}>
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{fmtMonthYear(monthCursor)}</Text>
            <Pressable onPress={() => setMonthCursor(addDays(monthCursor, 30))} hitSlop={12}>
              <Text style={styles.navArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={styles.weekday}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((d, i) => {
              if (!d) return <View key={i} style={styles.cell} />;
              const iso = toISODate(d);
              const kind = classifyDate(iso, periods, prediction);
              const isSelected = iso === selected;
              const isToday = iso === toISODate(new Date());
              return (
                <Pressable key={i} style={styles.cell} onPress={() => setSelected(iso)}>
                  <View style={[styles.dayDot, cellStyle(kind), isSelected && styles.daySelected]}>
                    <Text style={[styles.dayText, kind && styles.dayTextOn]}>{d.getDate()}</Text>
                  </View>
                  {isToday && <View style={styles.todayDot} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <Legend color={colors.purple} label="Regla" />
            <Legend color={colors.purpleDeep} label="Regla estimada" hollow />
            <Legend color={colors.blueSoft} label="Fértiles" />
            <Legend color={colors.starWhite} label="Ovulación" />
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <SectionTitle>{fmtLong(parseDate(selected))}</SectionTitle>
          <Text style={typography.bodyDim}>
            Selecciona un día del calendario y marca cuándo empezó y terminó tu regla.
          </Text>
          <PrimaryButton
            title="Marcar inicio de regla en este día"
            onPress={toggleSelectedAsPeriodStart}
            style={{ marginTop: spacing.md }}
          />
          <GhostButton
            title="Marcar como fin de la regla más reciente"
            onPress={extendPeriod}
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        <Text style={styles.disclaimer}>{CONTRACEPTIVE_DISCLAIMER}</Text>
      </ScrollView>
    </StarryBackground>
  );
}

function cellStyle(kind) {
  switch (kind) {
    case 'period':
      return { backgroundColor: colors.purple, borderColor: colors.purple };
    case 'predicted-period':
      return { borderColor: colors.purpleSoft, borderStyle: 'dashed', backgroundColor: 'transparent' };
    case 'fertile':
      return { backgroundColor: colors.blue, borderColor: colors.blueSoft };
    case 'ovulation':
      return { backgroundColor: colors.starWhite, borderColor: colors.starWhite };
    default:
      return {};
  }
}

function Legend({ color, label, hollow }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          hollow
            ? { borderColor: color, borderStyle: 'dashed' }
            : { backgroundColor: color, borderColor: color },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const CELL = `${100 / 7}%`;

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  brand: { ...typography.h1, marginBottom: spacing.md, textAlign: 'center' },
  predictionLine: { color: colors.text, marginTop: spacing.md, textAlign: 'center', fontSize: 15 },
  caveat: { color: colors.textFaint, marginTop: spacing.sm, textAlign: 'center', fontSize: 12, fontStyle: 'italic' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  monthTitle: { ...typography.h3, textTransform: 'capitalize' },
  navArrow: { color: colors.purpleSoft, fontSize: 28, paddingHorizontal: 12 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { width: CELL, textAlign: 'center', color: colors.textFaint, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayDot: {
    width: '86%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { color: colors.textDim, fontSize: 13 },
  dayTextOn: { color: '#fff', fontWeight: '700' },
  daySelected: { borderColor: colors.starWhite, borderWidth: 2 },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.purpleSoft, marginTop: 2 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, marginVertical: 3 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5, borderWidth: 1 },
  legendLabel: { color: colors.textDim, fontSize: 11 },
  disclaimer: {
    marginTop: spacing.lg,
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
