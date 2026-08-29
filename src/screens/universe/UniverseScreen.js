import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StarryBackground from '../../components/StarryBackground';
import { Card, SectionTitle, Tag } from '../../components/UI';
import { colors, spacing, typography } from '../../theme';
import { listDailyLogs, listPeriods } from '../../db/repositories';
import { computeStats } from '../../utils/cyclePredictions';
import { useUser } from '../../contexts/UserContext';
import { copyFor, SYMPTOMS, MOODS } from '../../utils/stageContent';

export default function UniverseScreen() {
  const { stage } = useUser();
  const [stats, setStats] = useState(null);

  const reload = useCallback(async () => {
    const [periods, logs] = await Promise.all([listPeriods(), listDailyLogs(10000)]);
    setStats(computeStats(periods, logs));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const copy = copyFor(stage);
  const labelForSymptom = (id) => SYMPTOMS.find((s) => s.id === id)?.label || id;
  const labelForMood = (id) => MOODS.find((m) => m.id === id)?.label || id;

  return (
    <StarryBackground seed={20}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={typography.h1}>Mi universo</Text>
        <Text style={[typography.bodyDim, { marginTop: 4 }]}>{copy.universeIntro}</Text>

        {stats ? (
          <>
            <Card style={styles.card}>
              <SectionTitle>Tu ciclo, en promedio</SectionTitle>
              <View style={styles.statRow}>
                <StatBig value={stats.cycleLength} label="días entre reglas" />
                <StatBig value={stats.periodLength} label="días de regla" />
              </View>
              <Text style={typography.bodyDim}>
                {stats.samples < 2
                  ? 'Necesito al menos 2 reglas registradas para ir aprendiendo tu ritmo. Con más registros, la predicción se ajusta a TU cuerpo.'
                  : `Estimado con tus últimas ${stats.samples} reglas. Puede cambiar mes a mes — es lo común.`}
              </Text>
            </Card>

            <Card style={styles.card}>
              <SectionTitle>Tus síntomas más frecuentes</SectionTitle>
              {stats.topSymptoms.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {stats.topSymptoms.map((s) => (
                    <Tag key={s.name} label={`${labelForSymptom(s.name)} · ${s.count}`} />
                  ))}
                </View>
              ) : (
                <Text style={typography.bodyDim}>
                  Aún no hay datos. Cuando anotes cómo te sientes en "Hoy", empezarán a aparecer los
                  patrones de TU cuerpo.
                </Text>
              )}
            </Card>

            <Card style={styles.card}>
              <SectionTitle>Tu ánimo más común</SectionTitle>
              <Text style={typography.body}>
                {stats.topMood
                  ? `${labelForMood(stats.topMood.name)} — anotado ${stats.topMood.count} ${
                      stats.topMood.count === 1 ? 'vez' : 'veces'
                    }.`
                  : 'Cuando marques tu ánimo unos días, aparecerá acá el que se repite más para ti.'}
              </Text>
            </Card>

            <Card style={styles.card}>
              <SectionTitle>Tu historial</SectionTitle>
              <Text style={typography.body}>Reglas registradas: {stats.periodsCount}</Text>
              <Text style={typography.body}>Días con registro: {stats.logsCount}</Text>
            </Card>

            <Text style={styles.finale}>
              Estos datos son solo tuyos. Nadie más los ve. Tu cuerpo tiene un ritmo propio — y este
              universo es de ese ritmo.
            </Text>
          </>
        ) : (
          <Text style={[typography.bodyDim, { marginTop: spacing.lg }]}>Cargando…</Text>
        )}
      </ScrollView>
    </StarryBackground>
  );
}

function StatBig({ value, label }) {
  return (
    <View style={styles.statBig}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  card: { marginTop: spacing.md },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.md },
  statBig: { alignItems: 'center' },
  statValue: { fontSize: 40, fontWeight: '800', color: colors.purpleSoft },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: 2, textAlign: 'center' },
  finale: {
    color: colors.textFaint,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 12,
  },
});
