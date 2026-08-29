import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { PrimaryButton, Chip, Card } from '../../components/UI';
import { colors, spacing, typography, radius } from '../../theme';
import { STAGES } from '../../utils/stageContent';
import { useUser } from '../../contexts/UserContext';

export default function OnboardingScreen() {
  const { update } = useUser();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState('');
  const [stage, setStage] = useState(null);

  const finish = async () => {
    await update('age', String(age || ''));
    await update('stage', stage || 'adulta');
    await update('onboarded', '1');
  };

  return (
    <StarryBackground seed={9}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.brand}>MILUNA</Text>
          <Text style={styles.slogan}>Mi luna, mi ciclo, mi universo</Text>
        </View>

        {step === 0 && (
          <Card style={styles.card}>
            <Text style={typography.h2}>Bienvenida</Text>
            <Text style={[typography.body, { marginTop: spacing.sm }]}>
              Miluna es tu calendario menstrual. Tus datos viven SOLO en tu teléfono, sin cuentas, sin
              servidores.
            </Text>
            <Text style={[typography.bodyDim, { marginTop: spacing.md }]}>
              Vamos a hacer solo dos preguntas para que la app hable como tú.
            </Text>
            <PrimaryButton title="Empezar" onPress={() => setStep(1)} style={{ marginTop: spacing.lg }} />
          </Card>
        )}

        {step === 1 && (
          <Card style={styles.card}>
            <Text style={typography.h2}>¿Cuántos años tienes?</Text>
            <Text style={[typography.bodyDim, { marginTop: spacing.sm }]}>
              Solo se guarda en tu teléfono. Puedes escribir un número aproximado.
            </Text>
            <TextInput
              value={age}
              onChangeText={(t) => setAge(t.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="Ej. 24"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              style={styles.input}
            />
            <PrimaryButton
              title="Siguiente"
              onPress={() => setStep(2)}
              disabled={!age}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        )}

        {step === 2 && (
          <Card style={styles.card}>
            <Text style={typography.h2}>¿En qué etapa estás?</Text>
            <Text style={[typography.bodyDim, { marginTop: spacing.sm }]}>
              La app adapta el lenguaje según tu momento. Puedes cambiarlo cuando quieras en Ajustes.
            </Text>
            <View style={{ marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap' }}>
              {STAGES.map((s) => (
                <Chip
                  key={s.id}
                  label={s.label}
                  active={stage === s.id}
                  onPress={() => setStage(s.id)}
                />
              ))}
            </View>
            {stage && (
              <Text style={[typography.bodyDim, { marginTop: spacing.md, fontStyle: 'italic' }]}>
                {STAGES.find((s) => s.id === stage).hint}
              </Text>
            )}
            <PrimaryButton
              title="Entrar a mi universo"
              onPress={finish}
              disabled={!stage}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        )}

        <Text style={styles.footer}>
          Cada cuerpo es distinto. La app se adapta a ti, no al revés.
        </Text>
      </ScrollView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.purpleSoft,
    letterSpacing: 6,
  },
  slogan: { color: colors.textDim, marginTop: 6, fontStyle: 'italic' },
  card: { marginBottom: spacing.lg },
  input: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    color: colors.text,
    fontSize: 18,
    backgroundColor: colors.bgSoft,
  },
  footer: { color: colors.textFaint, textAlign: 'center', marginTop: spacing.lg, fontSize: 12 },
});
