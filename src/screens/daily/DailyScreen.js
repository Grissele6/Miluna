import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card, Chip, PrimaryButton, SectionTitle } from '../../components/UI';
import { colors, spacing, typography } from '../../theme';
import { getDailyLog, upsertDailyLog } from '../../db/repositories';
import { toISODate, fmtLong } from '../../utils/dateHelpers';
import { MOODS, FLOW_LEVELS, SYMPTOMS, ENERGY_LEVELS } from '../../utils/stageContent';

export default function DailyScreen() {
  const today = toISODate(new Date());
  const [log, setLog] = useState({ mood: null, energy: null, flow: null, symptoms: [] });
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const l = await getDailyLog(today);
    if (l) setLog({ mood: l.mood, energy: l.energy, flow: l.flow, symptoms: l.symptoms || [] });
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSymptom = (id) => {
    setLog((prev) => {
      const has = prev.symptoms.includes(id);
      return {
        ...prev,
        symptoms: has ? prev.symptoms.filter((s) => s !== id) : [...prev.symptoms, id],
      };
    });
    setSaved(false);
  };

  const save = async () => {
    await upsertDailyLog(today, log);
    setSaved(true);
    Alert.alert('Guardado', 'Tu registro de hoy quedó guardado.');
  };

  return (
    <StarryBackground seed={6}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={typography.h1}>¿Cómo te sientes hoy?</Text>
        <Text style={[typography.bodyDim, { marginTop: 4, textTransform: 'capitalize' }]}>
          {fmtLong(new Date())}
        </Text>

        <Card style={styles.card}>
          <SectionTitle>Ánimo</SectionTitle>
          <View style={styles.row}>
            {MOODS.map((m) => (
              <Chip
                key={m.id}
                label={`${m.emoji}  ${m.label}`}
                active={log.mood === m.id}
                onPress={() => {
                  setLog((p) => ({ ...p, mood: m.id }));
                  setSaved(false);
                }}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Energía</SectionTitle>
          <View style={styles.row}>
            {ENERGY_LEVELS.map((e) => (
              <Chip
                key={e.id}
                label={e.label}
                active={log.energy === e.id}
                onPress={() => {
                  setLog((p) => ({ ...p, energy: e.id }));
                  setSaved(false);
                }}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Flujo</SectionTitle>
          <View style={styles.row}>
            {FLOW_LEVELS.map((f) => (
              <Chip
                key={f.id}
                label={f.label}
                active={log.flow === f.id}
                onPress={() => {
                  setLog((p) => ({ ...p, flow: f.id }));
                  setSaved(false);
                }}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Síntomas físicos</SectionTitle>
          <Text style={typography.bodyDim}>Toca los que sientas hoy.</Text>
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            {SYMPTOMS.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                active={log.symptoms.includes(s.id)}
                onPress={() => toggleSymptom(s.id)}
              />
            ))}
          </View>
        </Card>

        <PrimaryButton
          title={saved ? '✓ Guardado' : 'Guardar registro de hoy'}
          onPress={save}
          style={{ marginTop: spacing.md }}
        />
        <Text style={styles.footer}>
          Todo lo que registras vive solo en tu teléfono. Puedes borrar todo cuando quieras.
        </Text>
      </ScrollView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  card: { marginTop: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  footer: { color: colors.textFaint, textAlign: 'center', marginTop: spacing.md, fontSize: 12 },
});
