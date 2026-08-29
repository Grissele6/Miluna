import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card } from '../../components/UI';
import { colors, spacing, typography } from '../../theme';
import { orderedCategoriesForStage } from './learnContent';
import { useUser } from '../../contexts/UserContext';

export default function LearnScreen({ navigation }) {
  const { stage } = useUser();
  const categories = orderedCategoriesForStage(stage);

  return (
    <StarryBackground seed={12}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={typography.h1}>Aprende</Text>
        <Text style={[typography.bodyDim, { marginBottom: spacing.md }]}>
          Información honesta y sin susto. Cada cuerpo tiene su ritmo.
        </Text>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => navigation.navigate('LearnCategory', { id: c.id })}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.emoji}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{c.title}</Text>
                  <Text style={typography.bodyDim}>{c.summary}</Text>
                  <Text style={styles.count}>
                    {c.articles.length} {c.articles.length === 1 ? 'artículo' : 'artículos'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
        <Text style={styles.footer}>
          El orden se adapta a tu etapa. Cámbiala en Ajustes cuando quieras.
        </Text>
      </ScrollView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 30, marginRight: spacing.md },
  count: { color: colors.textFaint, fontSize: 11, marginTop: 4, letterSpacing: 0.3 },
  chevron: { color: colors.purpleSoft, fontSize: 26, marginLeft: spacing.sm },
  footer: {
    marginTop: spacing.md,
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
