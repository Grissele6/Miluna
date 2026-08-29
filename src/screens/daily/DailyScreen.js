import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput, Pressable } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card, Chip, PrimaryButton, GhostButton, SectionTitle, Tag } from '../../components/UI';
import { colors, spacing, typography, radius } from '../../theme';
import {
  addIntimacy,
  deleteIntimacy,
  getDailyLog,
  listIntimacyForDate,
  listPeriods,
  upsertDailyLog,
} from '../../db/repositories';
import { toISODate, fmtLong } from '../../utils/dateHelpers';
import {
  MOODS,
  FLOW_LEVELS,
  SYMPTOMS,
  ENERGY_LEVELS,
  CONTRACEPTIVE_METHODS,
  copyFor,
  PROBABILITY_DISCLAIMER,
  PREGNANCY_BLEEDING_MESSAGE,
} from '../../utils/stageContent';
import { useUser } from '../../contexts/UserContext';
import { buildPrediction, unprotectedRiskInfo } from '../../utils/cyclePredictions';
import { parseISO } from 'date-fns';
import { fmtShort } from '../../utils/dateHelpers';

export default function DailyScreen() {
  const today = toISODate(new Date());
  const { stage } = useUser();
  const copy = copyFor(stage);
  const isAdolescent = stage === 'adolescente';
  const isPregnant = stage === 'embarazo';

  const [log, setLog] = useState({ moods: [], energy: null, flow: null, symptoms: [], weightKg: null });
  const [weightText, setWeightText] = useState('');
  const [saved, setSaved] = useState(false);
  const [intimacyList, setIntimacyList] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const load = useCallback(async () => {
    const [l, ints, periods] = await Promise.all([
      getDailyLog(today),
      listIntimacyForDate(today),
      listPeriods(),
    ]);
    if (l) {
      setLog({
        moods: l.moods || [],
        energy: l.energy,
        flow: l.flow,
        symptoms: l.symptoms || [],
        weightKg: l.weightKg,
      });
      setWeightText(l.weightKg != null ? String(l.weightKg) : '');
    }
    setIntimacyList(ints);
    setPrediction(buildPrediction(periods));
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMood = (id) =>
    setLog((prev) => {
      const has = prev.moods.includes(id);
      return { ...prev, moods: has ? prev.moods.filter((m) => m !== id) : [...prev.moods, id] };
    });

  const toggleSymptom = (id) =>
    setLog((prev) => {
      const has = prev.symptoms.includes(id);
      return { ...prev, symptoms: has ? prev.symptoms.filter((s) => s !== id) : [...prev.symptoms, id] };
    });

  const parseWeight = (text) => {
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    const n = parseFloat(cleaned);
    if (isNaN(n) || n < 20 || n > 300) return null;
    return Math.round(n * 10) / 10;
  };

  const save = async () => {
    const weightKg = parseWeight(weightText);
    await upsertDailyLog(today, { ...log, weightKg });
    setSaved(true);

    if (isPregnant && log.flow && log.flow !== 'none') {
      Alert.alert('Sobre el sangrado', PREGNANCY_BLEEDING_MESSAGE);
      return;
    }
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
          <Text style={typography.bodyDim}>Puedes elegir más de uno.</Text>
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            {MOODS.map((m) => (
              <Chip
                key={m.id}
                label={`${m.emoji}  ${m.label}`}
                active={log.moods.includes(m.id)}
                onPress={() => {
                  toggleMood(m.id);
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
          <SectionTitle>{isPregnant ? 'Sangrado' : 'Flujo'}</SectionTitle>
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
          {isPregnant && log.flow && log.flow !== 'none' && (
            <Text style={styles.warn}>{PREGNANCY_BLEEDING_MESSAGE}</Text>
          )}
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
                onPress={() => {
                  toggleSymptom(s.id);
                  setSaved(false);
                }}
              />
            ))}
          </View>
        </Card>

        {!isAdolescent && (
          <Card style={styles.card}>
            <SectionTitle>Peso (opcional)</SectionTitle>
            <Text style={typography.bodyDim}>
              Solo si te sirve verlo en el tiempo. Sin metas, sin juicios.
            </Text>
            <TextInput
              value={weightText}
              onChangeText={(t) => {
                setWeightText(t);
                setSaved(false);
              }}
              placeholder="Ej. 62.5"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              style={styles.weightInput}
            />
            <Text style={typography.caption}>kg</Text>
          </Card>
        )}

        <IntimacySection
          today={today}
          intimacyList={intimacyList}
          reload={load}
          prediction={prediction}
        />

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

function IntimacySection({ today, intimacyList, reload, prediction }) {
  const [showForm, setShowForm] = useState(false);
  const [prot, setProt] = useState(true);
  const [method, setMethod] = useState('preservativo');

  const save = async () => {
    await addIntimacy(today, prot, method);
    setShowForm(false);
    setProt(true);
    setMethod('preservativo');
    await reload();

    if (!prot) {
      const risk = unprotectedRiskInfo(today, prediction);
      if (risk?.inWindow) {
        Alert.alert(
          'Aviso',
          `Este día cae dentro de tu ventana fértil estimada — probabilidad ${risk.probability}. ` +
            (risk.suggestTestDate
              ? `Si te preocupa, un test de embarazo tiene sentido desde ${fmtShort(parseISO(risk.suggestTestDate))} (primer día de atraso esperado). `
              : '') +
            'Existe la anticoncepción de emergencia y el tiempo importa: revisa el artículo en Aprende → Sexualidad segura. ' +
            PROBABILITY_DISCLAIMER
        );
      }
    }
  };

  const remove = async (id) => {
    Alert.alert('Quitar registro', '¿Quitar esta relación del día?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          await deleteIntimacy(id);
          await reload();
        },
      },
    ]);
  };

  return (
    <Card style={{ marginTop: spacing.md }}>
      <SectionTitle>Relaciones sexuales (opcional)</SectionTitle>
      <Text style={typography.bodyDim}>Discreto y privado. Solo tú lo ves.</Text>

      {intimacyList.length > 0 && (
        <View style={{ marginTop: spacing.sm, flexDirection: 'row', flexWrap: 'wrap' }}>
          {intimacyList.map((it) => (
            <Pressable key={it.id} onLongPress={() => remove(it.id)}>
              <Tag
                label={`${it.protectedFlag ? 'Con protección' : 'Sin protección'} · ${it.method || '—'}`}
                color={it.protectedFlag ? colors.success : colors.warning}
              />
            </Pressable>
          ))}
          <Text style={typography.caption}>Deja pulsado para quitar.</Text>
        </View>
      )}

      {!showForm ? (
        <GhostButton
          title="+ Añadir registro"
          onPress={() => setShowForm(true)}
          style={{ marginTop: spacing.sm }}
        />
      ) : (
        <View style={{ marginTop: spacing.sm }}>
          <View style={styles.row}>
            <Chip label="Con protección" active={prot} onPress={() => setProt(true)} />
            <Chip label="Sin protección" active={!prot} onPress={() => setProt(false)} />
          </View>
          <Text style={[typography.bodyDim, { marginTop: 4 }]}>Método:</Text>
          <View style={[styles.row, { marginTop: 4 }]}>
            {CONTRACEPTIVE_METHODS.map((m) => (
              <Chip
                key={m.id}
                label={m.label}
                active={method === m.id}
                onPress={() => setMethod(m.id)}
              />
            ))}
          </View>
          <PrimaryButton title="Guardar" onPress={save} style={{ marginTop: spacing.sm }} />
          <GhostButton
            title="Cancelar"
            onPress={() => setShowForm(false)}
            style={{ marginTop: spacing.xs }}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  card: { marginTop: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  footer: { color: colors.textFaint, textAlign: 'center', marginTop: spacing.md, fontSize: 12 },
  warn: { color: colors.warning, marginTop: spacing.sm, fontSize: 13 },
  weightInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    fontSize: 18,
    backgroundColor: colors.bgSoft,
  },
});
