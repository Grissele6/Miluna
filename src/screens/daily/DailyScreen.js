import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card, Chip, PrimaryButton, GhostButton, SectionTitle, Tag } from '../../components/UI';
import { colors, spacing, typography, radius } from '../../theme';
import {
  addIntimacy,
  deleteIntimacy,
  getDailyLog,
  getLatestHeight,
  listIntimacyForDate,
  listPeriods,
  upsertDailyLog,
} from '../../db/repositories';
import { toISODate, fmtLong, addDays, fmtShort } from '../../utils/dateHelpers';
import {
  MOODS,
  FLOW_LEVELS,
  FLOW_TYPES,
  SYMPTOMS,
  ENERGY_LEVELS,
  CONTRACEPTIVE_METHODS,
  copyFor,
  PROBABILITY_DISCLAIMER,
  PREGNANCY_BLEEDING_MESSAGE,
} from '../../utils/stageContent';
import { useUser } from '../../contexts/UserContext';
import { buildPrediction, unprotectedRiskInfo } from '../../utils/cyclePredictions';
import { parseISO, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const EMPTY_LOG = {
  moods: [],
  energy: null,
  flow: null,
  flowType: null,
  symptoms: [],
  weightKg: null,
  heightCm: null,
};

export default function DailyScreen() {
  const { stage } = useUser();
  const copy = copyFor(stage);
  const isPregnant = stage === 'embarazo';

  const todayISO = toISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [log, setLog] = useState(EMPTY_LOG);
  const [weightText, setWeightText] = useState('');
  const [heightText, setHeightText] = useState('');
  const [saved, setSaved] = useState(false);
  const [intimacyList, setIntimacyList] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const load = useCallback(async () => {
    const [l, ints, periods, latestHeight] = await Promise.all([
      getDailyLog(selectedDate),
      listIntimacyForDate(selectedDate),
      listPeriods(),
      getLatestHeight(),
    ]);
    const next = l
      ? {
          moods: l.moods || [],
          energy: l.energy,
          flow: l.flow,
          flowType: l.flowType,
          symptoms: l.symptoms || [],
          weightKg: l.weightKg,
          heightCm: l.heightCm,
        }
      : EMPTY_LOG;
    setLog(next);
    setWeightText(next.weightKg != null ? String(next.weightKg) : '');
    setHeightText(
      next.heightCm != null
        ? String(next.heightCm)
        : latestHeight != null
        ? String(latestHeight)
        : ''
    );
    setIntimacyList(ints);
    setPrediction(buildPrediction(periods));
    setSaved(false);
  }, [selectedDate]);

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

  const parseNumber = (text, min, max, decimals = 1) => {
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    const n = parseFloat(cleaned);
    if (isNaN(n) || n < min || n > max) return null;
    return Math.round(n * 10 ** decimals) / 10 ** decimals;
  };

  const save = async () => {
    const weightKg = parseNumber(weightText, 20, 300, 1);
    const heightCm = parseNumber(heightText, 100, 230, 0);
    await upsertDailyLog(selectedDate, { ...log, weightKg, heightCm });
    setSaved(true);

    if (isPregnant && log.flow && log.flow !== 'none') {
      Alert.alert('Sobre el sangrado', PREGNANCY_BLEEDING_MESSAGE);
      return;
    }
    Alert.alert('Guardado', `Registro guardado para ${fmtShort(parseISO(selectedDate))}.`);
  };

  const isToday = selectedDate === todayISO;

  return (
    <StarryBackground seed={6}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={typography.h1}>¿Cómo te sientes hoy?</Text>
        <Text style={[typography.bodyDim, { marginTop: 4 }]}>
          {isToday ? 'Estás anotando hoy.' : 'Estás anotando un día anterior.'}
        </Text>

        <DateStrip
          selectedDate={selectedDate}
          onSelect={(d) => setSelectedDate(d)}
          todayISO={todayISO}
        />

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

        {/* Flujo — cantidad + tipo agrupados */}
        <Card style={styles.card}>
          <SectionTitle>{isPregnant ? 'Sangrado' : 'Flujo'}</SectionTitle>

          <Text style={styles.subLabel}>Cantidad</Text>
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

          <Text style={[styles.subLabel, { marginTop: spacing.md }]}>Tipo</Text>
          <View style={styles.row}>
            {FLOW_TYPES.map((t) => (
              <Chip
                key={t.id}
                label={t.label}
                active={log.flowType === t.id}
                onPress={() => {
                  setLog((p) => ({ ...p, flowType: t.id }));
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
          <Text style={typography.bodyDim}>Toca los que sientas.</Text>
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

        <IntimacySection
          date={selectedDate}
          intimacyList={intimacyList}
          reload={load}
          prediction={prediction}
        />

        {/* Peso y talla — bloque único al final */}
        <Card style={styles.card}>
          <SectionTitle>Peso y talla (opcional)</SectionTitle>
          <Text style={typography.bodyDim}>
            Solo si te sirve verlo en el tiempo. Sin metas, sin juicios.
          </Text>
          <View style={styles.measureRow}>
            <View style={styles.measureCol}>
              <Text style={styles.subLabel}>Peso</Text>
              <TextInput
                value={weightText}
                onChangeText={(t) => {
                  setWeightText(t);
                  setSaved(false);
                }}
                placeholder="62.5"
                placeholderTextColor={colors.textFaint}
                keyboardType="decimal-pad"
                style={styles.numInput}
              />
              <Text style={typography.caption}>kg</Text>
            </View>
            <View style={styles.measureCol}>
              <Text style={styles.subLabel}>Talla</Text>
              <TextInput
                value={heightText}
                onChangeText={(t) => {
                  setHeightText(t);
                  setSaved(false);
                }}
                placeholder="165"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                style={styles.numInput}
              />
              <Text style={typography.caption}>cm</Text>
            </View>
          </View>
        </Card>

        <PrimaryButton
          title={saved ? '✓ Guardado' : 'Guardar registro'}
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

function DateStrip({ selectedDate, onSelect, todayISO }) {
  // Last 14 days (oldest → newest, so "today" sits on the right).
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }).map((_, i) => addDays(today, -(13 - i)));
  }, []);
  return (
    <Card style={styles.card}>
      <SectionTitle>Fecha</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScroll}
      >
        {days.map((d) => {
          const iso = toISODate(d);
          const active = iso === selectedDate;
          const isToday = iso === todayISO;
          return (
            <Pressable
              key={iso}
              onPress={() => onSelect(iso)}
              style={[styles.dateChip, active && styles.dateChipActive]}
            >
              <Text style={[styles.dateWeekday, active && styles.dateOn]}>
                {format(d, 'EEE', { locale: es }).slice(0, 3)}
              </Text>
              <Text style={[styles.dateNum, active && styles.dateOn]}>{format(d, 'd')}</Text>
              {isToday && <Text style={styles.dateToday}>hoy</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.dateSelectedLine}>
        {fmtLong(parseISO(selectedDate))}
      </Text>
    </Card>
  );
}

function IntimacySection({ date, intimacyList, reload, prediction }) {
  const [showForm, setShowForm] = useState(false);
  const [prot, setProt] = useState(true);
  const [method, setMethod] = useState('preservativo');

  const save = async () => {
    await addIntimacy(date, prot, method);
    setShowForm(false);
    setProt(true);
    setMethod('preservativo');
    await reload();

    if (!prot) {
      const risk = unprotectedRiskInfo(date, prediction);
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
  subLabel: { color: colors.textDim, fontSize: 12, letterSpacing: 0.4, marginTop: 4 },
  footer: { color: colors.textFaint, textAlign: 'center', marginTop: spacing.md, fontSize: 12 },
  warn: { color: colors.warning, marginTop: spacing.sm, fontSize: 13 },
  measureRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    justifyContent: 'space-between',
  },
  measureCol: { flex: 1, marginHorizontal: 4 },
  numInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    fontSize: 18,
    backgroundColor: colors.bgSoft,
  },
  dateScroll: { paddingVertical: spacing.sm, paddingRight: spacing.sm },
  dateChip: {
    width: 54,
    marginRight: 6,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: colors.purpleDeep,
    borderColor: colors.purpleSoft,
  },
  dateWeekday: {
    color: colors.textFaint,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dateNum: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 2 },
  dateOn: { color: '#fff' },
  dateToday: { color: colors.purpleSoft, fontSize: 10, marginTop: 2 },
  dateSelectedLine: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
});
