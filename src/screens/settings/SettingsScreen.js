import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Share, Platform, Switch } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card, Chip, GhostButton, PrimaryButton, SectionTitle } from '../../components/UI';
import { colors, spacing, typography } from '../../theme';
import { STAGES } from '../../utils/stageContent';
import { useUser } from '../../contexts/UserContext';
import {
  exportAll,
  listReminders,
  upsertReminder,
} from '../../db/repositories';
import { resetDatabase } from '../../db/database';
import { cancel, cancelAll, ensurePermissions, scheduleDaily } from '../../services/notifications';

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
};

export default function SettingsScreen({ navigation }) {
  const { stage, update, reload } = useUser();
  const [reminders, setReminders] = useState([]);

  const loadReminders = useCallback(async () => {
    setReminders(await listReminders());
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const setStage = async (id) => {
    await update('stage', id);
  };

  const toggleReminder = async (kind) => {
    const existing = reminders.find((r) => r.kind === kind);
    const config = REMINDER_KINDS[kind];
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
    } else {
      const ok = await ensurePermissions();
      if (!ok) {
        Alert.alert(
          'Sin permiso',
          'Necesito permiso para enviarte recordatorios. Puedes activarlo en los ajustes del teléfono.'
        );
        return;
      }
      const hour = existing?.hour ?? config.defaultHour;
      const minute = existing?.minute ?? config.defaultMinute;
      const notifId = await scheduleDaily({
        hour,
        minute,
        title: config.label,
        body: config.body,
      });
      await upsertReminder({
        id: existing?.id,
        kind,
        enabled: true,
        hour,
        minute,
        notifId,
      });
    }
    loadReminders();
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
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Recordatorios</SectionTitle>
          {Object.entries(REMINDER_KINDS).map(([kind, cfg]) => {
            const r = reminders.find((rr) => rr.kind === kind);
            const enabled = !!r?.enabled;
            const hour = r?.hour ?? cfg.defaultHour;
            const minute = r?.minute ?? cfg.defaultMinute;
            return (
              <View key={kind} style={styles.reminderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{cfg.label}</Text>
                  <Text style={typography.bodyDim}>
                    {enabled ? `Cada día a las ${pad(hour)}:${pad(minute)}` : 'Desactivado'}
                  </Text>
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
          <Text style={[typography.caption, { marginTop: spacing.sm }]}>
            Los recordatorios usan notificaciones locales de tu teléfono.
          </Text>
        </Card>

        <Card style={styles.card}>
          <SectionTitle>Tus datos</SectionTitle>
          <Text style={typography.bodyDim}>
            Todo lo tuyo está SOLO en este teléfono. No hay cuentas, ni servidores, ni sincronización.
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
            (reglas, síntomas, ánimo) se guarda cifrado por el sistema operativo, solo en tu teléfono.
          </Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            No enviamos tu información a ningún servidor. No compartimos datos con terceros.
          </Text>
          <Text style={[typography.bodyDim, { marginTop: spacing.sm, fontStyle: 'italic' }]}>
            Si en el futuro agregamos publicidad, será claramente identificada y podrás verla o no
            verla. Nunca usaremos tus datos de salud para segmentar avisos.
          </Text>
        </Card>

        <Text style={styles.footer}>
          Miluna · versión 1.0.0 · Hecho con cariño para acompañar tu ciclo.
        </Text>
      </ScrollView>
    </StarryBackground>
  );
}

function pad(n) {
  return String(n).padStart(2, '0');
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
  footer: {
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 12,
  },
});
