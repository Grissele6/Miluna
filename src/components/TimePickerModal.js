import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { PrimaryButton, GhostButton } from './UI';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function TimePickerModal({ visible, initialHour = 9, initialMinute = 0, title, onCancel, onSave }) {
  const [hour, setHour] = useState(String(initialHour));
  const [minute, setMinute] = useState(pad(initialMinute));

  useEffect(() => {
    if (visible) {
      setHour(String(initialHour));
      setMinute(pad(initialMinute));
    }
  }, [visible, initialHour, initialMinute]);

  const commit = () => {
    let h = parseInt(hour, 10);
    let m = parseInt(minute, 10);
    if (isNaN(h) || h < 0 || h > 23) h = 9;
    if (isNaN(m) || m < 0 || m > 59) m = 0;
    onSave(h, m);
  };

  const adjust = (setter, val, min, max, delta) => {
    let n = parseInt(val, 10);
    if (isNaN(n)) n = 0;
    n = Math.max(min, Math.min(max, n + delta));
    setter(pad(n));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={typography.h3}>{title || 'Elige una hora'}</Text>
          <Text style={[typography.bodyDim, { marginTop: 4 }]}>Formato 24h.</Text>

          <View style={styles.timeRow}>
            <TimeBox
              value={pad(parseInt(hour, 10) || 0)}
              onChange={setHour}
              onUp={() => adjust(setHour, hour, 0, 23, 1)}
              onDown={() => adjust(setHour, hour, 0, 23, -1)}
              max={23}
            />
            <Text style={styles.colon}>:</Text>
            <TimeBox
              value={pad(parseInt(minute, 10) || 0)}
              onChange={setMinute}
              onUp={() => adjust(setMinute, minute, 0, 59, 5)}
              onDown={() => adjust(setMinute, minute, 0, 59, -5)}
              max={59}
            />
          </View>

          <PrimaryButton title="Guardar hora" onPress={commit} style={{ marginTop: spacing.md }} />
          <GhostButton title="Cancelar" onPress={onCancel} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </Modal>
  );
}

function TimeBox({ value, onChange, onUp, onDown, max }) {
  return (
    <View style={styles.timeBox}>
      <Pressable onPress={onUp} hitSlop={12}>
        <Text style={styles.arrow}>▲</Text>
      </Pressable>
      <TextInput
        value={value}
        onChangeText={(t) => {
          const clean = t.replace(/[^0-9]/g, '').slice(0, 2);
          onChange(clean);
        }}
        keyboardType="number-pad"
        maxLength={2}
        style={styles.input}
        selectTextOnFocus
      />
      <Pressable onPress={onDown} hitSlop={12}>
        <Text style={styles.arrow}>▼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  timeBox: { alignItems: 'center', paddingHorizontal: 6 },
  arrow: { color: colors.purpleSoft, fontSize: 18, paddingVertical: 4 },
  input: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 4,
  },
  colon: { color: colors.textDim, fontSize: 40, fontWeight: '700', marginHorizontal: 4 },
});
