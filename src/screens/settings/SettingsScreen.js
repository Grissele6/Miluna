import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  Switch,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card, Chip, GhostButton, PrimaryButton, SectionTitle } from '../../components/UI';
import { colors, spacing, typography, radius } from '../../theme';
import { STAGES } from '../../utils/stageContent';
import { useUser } from '../../contexts/UserContext';
import { exportAll, listReminders, upsertReminder } from '../../db/repositories';
import { resetDatabase } from '../../db/database';
import { cancel, cancelAll, ensurePermissions, scheduleDaily } from '../../services/notifications';
import TimePickerModal from '../../components/TimePickerModal';

const REMINDER_KINDS = {
  period: {
    label: 'Regla próxima',
    body: 'Se acerca tu próxima regla. Tenlo presente.',
    defaultHour: 9,
    defaultMinute: 0,
  },
  contraceptive: {
    label: 'Anticonceptivo',
    body: 'Hora de tu anticonceptivo.',
    defaultHour: 21,
    defaultMinute: 0,
  },
  daily: {
    label: 'Registro diario',
    body: '¿Cómo te sientes hoy?',
    defaultHour: 20,
    defaultMinute: 0,
  },
  fertile: {
    label: 'Días fértiles (Buscando embarazo)',
    body: 'Hoy tienes alta probabilidad de embarazo.',
    defaultHour: 8,
    defaultMinute: 0,
    stageOnly: 'buscando',
  },
};

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function SettingsScreen() {
  const { stage, settings, update, reload } = useUser();
  const [reminders, setReminders] = useState([]);
  const [editing, setEditing] = useState(null); // {kind, hour, minute}
  const [showLmpModal, setShowLmpModal] = useState(false);

  const loadReminders = useCallback(async () => {
    setReminders(await listReminders());
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const setStage = async (id) => {
    await update('stage', id);
    if (id === 'embarazo' && !settings.pregnancy_lmp) {
      setShowLmpModal(true);
    }
  };

  const scheduleReminder = async (kind, hour, minute, existing) => {
    const cfg = REMINDER_KINDS[kind];
    const notifId = await scheduleDaily({ hour, minute, title: cfg.label, body: cfg.body });
    await upsertReminder({ id: existing?.id, kind, enabled: true, hour, minute, notifId });
    loadReminders();
  };

  const toggleReminder = async (kind) => {
    const existing = reminders.find((r) => r.kind === kind);
    const cfg = REMINDER_KINDS[kind];
    if (existing && existing.enabled) {
      await cancel(existing.notif_id);
      await upsertReminder({
        id: existing.id,
        kind,
        enabled: false,
        hour: existing.hour,
        minute: existing.minute,
        notifId: null,
      });
      loadReminders();
    } else {
      const ok = await ensurePermissions();
      if (!ok) {
        Alert.alert(
          'Sin permiso',
          'Necesito permiso para enviarte recordatorios. Actívalo en los ajustes del teléfono.'
        );
        return;
      }
      const hour = existing?.hour ?? cfg.defaultHour;
      const minute = existing?.minute ?? cfg.defaultMinute;
      await scheduleReminder(kind, hour, minute, existing);
    }
  };

  const changeReminderTime = async (kind, hour, minute) => {
    setEditing(null);
    const existing = reminders.find((r) => r.kind === kind);
    if (existing?.enabled) {
      await cancel(existing.notif_id);
      await scheduleReminder(kind, hour, minute, existing);
    } else {
      await upsertReminder({
        id: existing?.id,
        kind,
        enabled: false,
        hour,
        minute,
        notifId: null,
      });
      loadReminders();
    }
  };

  const doExport = async () => {
    const data = await exportAll();
    const json = JSON.stringify(data, null, 2);
    try {
      await Share.share({ message: json });
    } catch (e) {
      Alert.alert('No se pudo compartir', String(e?.message ?? e));
    }
  };

  const doErase = () => {
    Alert.alert(
      'Borrar todos mis datos',
      'Esto elimina reglas, registros diarios, ajustes y recordatorios de tu teléfono. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            await cancelAll();
            await resetDatabase();
            await reload();
          },
        },
      ]
    );
  };

  const applicableKinds = Object.entries(REMINDER_KINDS).filter(
    ([, cfg]) => !cfg.stageOnly || cfg.stageOnly === stage
  );

  const editingCfg = editing ? REMINDER_KINDS[editing.kind] : null;

  return (
    <StarryBackground seed={30}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={typography.h1}>Ajustes</Text>

        <Card style={styles.card}>
          <SectionTitle>Etapa</SectionTitle>
          <Text style={typography.bodyDim}>
            La app adapta el lenguaje a tu etapa. Cámbialo cuando lo necesites.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
            {STAGES.map((s) => (
              <Chip key={s.id} label={s.label} active={stage === s.id} onPress={() => setStage(s.id)} />
            ))}
          </View>
          {stage === 'embarazo' && (
            <View style={styles.lmpRow}>
              <Text style={typography.body}>
                Fecha de última regla:{' '}
                <Text style={styles.strong}>{settings.pregnancy_lmp || 'no definida'}</Text>
              </Text>
              <GhostButton
                title={settings.pregnancy_lmp ? 'Cambiar fecha' : 'Definir fecha'}
                onPress={() => setShowLmpModal(true)}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Perfil (opcional)</SectionTitle>
          <Text style={typography.bodyDim}>Solo para tus estadísticas. Sin metas, sin juicios.</Text>
          <HeightRow value={settings.height_cm || ''} onSave={(v) => update('height_cm', v)} />
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Recordatorios</SectionTitle>
          <Text style={typography.bodyDim}>
            Notificaciones locales. Cada uno tiene su propia hora.
          </Text>
          {applicableKinds.map(([kind, cfg]) => {
            const r = reminders.find((rr) => rr.kind === kind);
            const enabled = !!r?.enabled;
            const hour = r?.hour ?? cfg.defaultHour;
            const minute = r?.minute ?? cfg.defaultMinute;
            return (
              <View key={kind} style={styles.reminderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{cfg.label}</Text>
                  <Pressable onPress={() => setEditing({ kind, hour, minute })}>
                    <Text style={styles.timeLine}>
                      {pad(hour)}:{pad(minute)}{'  '}
                      <Text style={styles.timeEdit}>✎ Cambiar hora</Text>
                    </Text>
                  </Pressable>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={() => toggleReminder(kind)}
                  thumbColor={enabled ? colors.purpleSoft : colors.textFaint}
                  trackColor={{ true: colors.purpleDeep, false: colors.border }}
                />
              </View>
            );
          })}
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Tus datos</SectionTitle>
          <Text style={typography.bodyDim}>
            Todo lo tuyo está SOLO en este teléfono. No hay cuentas, ni servidores.
          </Text>
          <GhostButton title="Exportar mis datos (JSON)" onPress={doExport} style={{ marginTop: spacing.md }} />
          <PrimaryButton
            title="Borrar todos mis datos"
            onPress={doErase}
            style={{ marginTop: spacing.sm, backgroundColor: colors.danger }}
          />
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Privacidad</SectionTitle>
          <Text style={typography.body}>
            Miluna no recolecta datos personales. No usa cuentas ni contraseñas. Todo lo que anotas
            se guarda solo en tu teléfono.
          </Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            No enviamos tu información a ningún servidor. No compartimos con terceros.
          </Text>
        </Card>

        <Text style={styles.footer}>
          Miluna · versión 2.0 · Hecho con cariño para acompañar tu ciclo.
        </Text>
      </ScrollView>

      <TimePickerModal
        visible={!!editing}
        title={editingCfg?.label}
        initialHour={editing?.hour ?? 9}
        initialMinute={editing?.minute ?? 0}
        onCancel={() => setEditing(null)}
        onSave={(h, m) => changeReminderTime(editing.kind, h, m)}
      />

      <LmpModal
        visible={showLmpModal}
        initial={settings.pregnancy_lmp}
        onCancel={() => setShowLmpModal(false)}
        onSave={async (iso) => {
          await update('pregnancy_lmp', iso);
          setShowLmpModal(false);
        }}
      />
    </StarryBackground>
  );
}

function HeightRow({ value, onSave }) {
  const [text, setText] = useState(value || '');
  return (
    <View style={styles.heightRow}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Talla en cm (ej. 165)"
        placeholderTextColor={colors.textFaint}
        keyboardType="number-pad"
        style={styles.heightInput}
      />
      <GhostButton
        title="Guardar"
        onPress={() => {
          const n = parseInt(text, 10);
          if (isNaN(n) || n < 100 || n > 230) {
            Alert.alert('Talla inválida', 'Usa un valor entre 100 y 230 cm.');
            return;
          }
          onSave(String(n));
          Alert.alert('Guardado', `Talla: ${n} cm`);
        }}
      />
    </View>
  );
}

function LmpModal({ visible, initial, onCancel, onSave }) {
  const [text, setText] = useState(initial || '');
  useEffect(() => {
    if (visible) setText(initial || '');
  }, [visible, initial]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card2}>
          <SectionTitle>Fecha de última regla</SectionTitle>
          <Text style={typography.bodyDim}>
            Formato AAAA-MM-DD. Con esto calculamos tu semana de gestación estimada.
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="2025-11-14"
            placeholderTextColor={colors.textFaint}
            style={styles.heightInput}
          />
          <PrimaryButton
            title="Guardar"
            onPress={() => {
              if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD.');
                return;
              }
              onSave(text);
            }}
            style={{ marginTop: spacing.md }}
          />
          <GhostButton title="Cancelar" onPress={onCancel} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  card: { marginTop: spacing.md },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeLine: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  timeEdit: { color: colors.purpleSoft, fontSize: 12 },
  strong: { color: colors.purpleSoft, fontWeight: '700' },
  lmpRow: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  heightRow: { marginTop: spacing.sm },
  heightInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.bgSoft,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card2: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 12,
  },
});
