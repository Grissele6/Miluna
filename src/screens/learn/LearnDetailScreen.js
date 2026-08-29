import React, { useLayoutEffect } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card } from '../../components/UI';
import { colors, spacing, typography } from '../../theme';
import { LEARN_SECTIONS } from './learnContent';

export default function LearnDetailScreen({ route, navigation }) {
  const id = route?.params?.id;
  const section = LEARN_SECTIONS.find((s) => s.id === id) || LEARN_SECTIONS[0];

  useLayoutEffect(() => {
    navigation.setOptions({ title: section.title });
  }, [navigation, section.title]);

  return (
    <StarryBackground seed={15}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>{section.emoji}</Text>
        <Text style={typography.h1}>{section.title}</Text>
        <Text style={[typography.bodyDim, { marginTop: 6 }]}>{section.summary}</Text>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={typography.h3}>Contenido en revisión — próximamente</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            Estamos preparando contenido cuidado y revisado para esta sección. Queremos que sea claro,
            honesto y sin susto.
          </Text>
          <Text style={[typography.bodyDim, { marginTop: spacing.md, fontStyle: 'italic' }]}>
            Recuerda: lo que encuentres acá es informativo. Ante cualquier duda importante sobre tu
            cuerpo, siempre puedes consultar a un profesional de salud de confianza.
          </Text>
        </Card>
      </ScrollView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  emoji: { fontSize: 44, marginBottom: spacing.sm },
});
