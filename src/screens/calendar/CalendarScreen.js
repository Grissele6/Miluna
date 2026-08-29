import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import OrbitCycle from '../../components/OrbitCycle';
import { Card, PrimaryButton, GhostButton, SectionTitle } from '../../components/UI';
import { colors, spacing, typography } from '../../theme';
import { addPeriod, listPeriods, removePeriod, listIntimacy } from '../../db/repositories';
import { buildPrediction, classifyDate, pregnancyProbability } from '../../utils/cyclePredictions';
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
import {
  CONTRACEPTIVE_DISCLAIMER,
  PREGNANCY_BLEEDING_MESSAGE,
  PROBABILITY_DISCLAIMER,
  copyFor,
} from '../../utils/stageContent';
import { useUser } from '../../contexts/UserContext';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CalendarScreen() {
  const { stage } = useUser();
  const copy = copyFor(stage);
  const isPregnant = stage === 'embarazo';

  const [monthCursor, setMonthCursor] = useState(new Date());
  const [periods, setPeriods] = useState([]);
  const [intimacy, setIntimacy] = useState([]);
  const [selected, setSelected] = useState(toISODate(new Date()));

  const reload = useCallback(async () => {
    const [p, i] = await Promise.all([listPeriods(), listIntimacy(1000)]);
    setPeriods(p);
    setIntimacy(i);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);

  const intimacyByDate = useMemo(() => {
    const map = {};
    for (const it of intimacy) {
      map[it.date] = map[it.date] || [];
      map[it.date].push(it);
    }
    return map;
  }, [intimacy]);

  const prediction = useMemo(() => buildPrediction(periods), [periods]);

  const days = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    const all = eachDayOfInterval({ start, end });
    const firstDow = (getDay(start) + 6) % 7;
    return [...Array(firstDow).fill(null), ...all];
  }, [monthCursor]);

  const trailing = (7 - (days.length % 7)) % 7;
  const grid = [...days, ...Array(trailing).fill(null)];

  const toggleSelectedAsPeriodStart = async () => {
    const iso = selected;
    const already = periods.find((p) => p.startDate === iso);
    const label = isPregnant ? 'sangrado' : 'inicio de regla';
    if (already) {
      Alert.alert(`Quitar ${label}`, `Este día está marcado. ¿Quitarlo?`, [
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
    if (isPregnant) {
      Alert.alert('Sobre el sangrado', PREGNANCY_BLEEDING_MESSAGE);
    }
    reload();
  };

  const extendPeriod = async () => {
    if (!periods.length) return;
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    let target = null;
    for (const p of sorted) if (p.startDate <= selected) target = p;
    if (!target) {
      Alert.alert(
        'Marca primero el inicio',
        `Toca el día en que empezó tu ${copy.periodWord} y luego "Marcar inicio".`
      );
      return;
    }
    const newEnd = selected >= target.startDate ? selected : target.startDate;
    await addPeriod(target.startDate, newEnd);
    reload();
  };

  const selectedProb = pregnancyProbability(selected, periods, prediction);
  const selectedIntim = intimacyByDate[selected] || [];

  return (
    <StarryBackground seed={4}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>Mi calendario</Text>

        {!isPregnant && (
          <Card style={{ alignItems: 'center' }}>
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
            <Text style={styles.predictionLine}>
              {prediction.nextPeriodStart
                ? `Próxima ${copy.periodWord} estimada: ${fmtLong(parseDate(prediction.nextPeriodStart))}`
                : `Marca tu primer${copy.periodWord === 'regla' ? 'a' : ''} ${copy.periodWord} para empezar a predecir tu ciclo.`}
            </Text>
            <Text style={styles.caveat}>{copy.predictionCaveat}</Text>
          </Card>
        )}

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
              const hasIntim = !!intimacyByDate[iso]?.length;
              return (
                <Pressable key={i} style={styles.cell} onPress={() => setSelected(iso)}>
                  <View style={[styles.dayDot, cellStyle(kind), isSelected && styles.daySelected]}>
                    <Text style={[styles.dayText, kind && styles.dayTextOn]}>{d.getDate()}</Text>
                  </View>
                  <View style={styles.dotRow}>
                    {isToday && <View style={styles.todayDot} />}
                    {hasIntim && <View style={styles.intimDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <Legend color={colors.purple} label={copy.periodWord} />
            {!isPregnant && <Legend color={colors.purpleDeep} label={`${copy.periodWord} estimada`} hollow />}
            {!isPregnant && <Legend color={colors.blueSoft} label="Fértiles" />}
            {!isPregnant && <Legend color={colors.starWhite} label="Ovulación" />}
            <Legend color={colors.warning} label="Íntimo" small />
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <SectionTitle>{fmtLong(parseDate(selected))}</SectionTitle>
          {!isPregnant && selectedProb && (
            <Text style={typography.bodyDim}>
              Probabilidad de embarazo estimada: <Text style={{ color: colors.text, fontWeight: '700' }}>{selectedProb.toUpperCase()}</Text>
            </Text>
          )}
          {selectedIntim.length > 0 && (
            <Text style={[typography.bodyDim, { marginTop: 4 }]}>
              Registro íntimo: {selectedIntim
                .map((s) => (s.protectedFlag ? `con protección (${s.method || '—'})` : `sin protección (${s.method || 'ninguno'})`))
                .join(' · ')}
            </Text>
          )}
          <PrimaryButton
            title={`Marcar inicio de ${copy.periodWord} en este día`}
            onPress={toggleSelectedAsPeriodStart}
            style={{ marginTop: spacing.md }}
          />
          <GhostButton
            title={`Marcar como fin de${copy.periodWord === 'regla' ? ' la regla' : 'l sangrado'} más reciente`}
            onPress={extendPeriod}
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        <Text style={styles.disclaimer}>{CONTRACEPTIVE_DISCLAIMER}</Text>
        {!isPregnant && <Text style={styles.disclaimer}>{PROBABILITY_DISCLAIMER}</Text>}
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
  dotRow: { flexDirection: 'row', marginTop: 2, height: 6, alignItems: 'center' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.purpleSoft, marginHorizontal: 1 },
  intimDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.warning, marginHorizontal: 1 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, marginVertical: 3 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5, borderWidth: 1 },
  legendLabel: { color: colors.textDim, fontSize: 11 },
  disclaimer: {
    marginTop: spacing.md,
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
