import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card } from '../../components/UI';
import { colors, spacing, typography, radius } from '../../theme';
import { LEARN_SECTIONS } from './learnContent';

export default function LearnScreen({ navigation }) {
  return (
    <StarryBackground seed={12}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={typography.h1}>Aprende</Text>
        <Text style={[typography.bodyDim, { marginBottom: spacing.md }]}>
          Información honesta y sin susto. Cada cuerpo tiene su ritmo.
        </Text>
        {LEARN_SECTIONS.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => navigation.navigate('LearnDetail', { id: s.id })}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.emoji}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{s.title}</Text>
                  <Text style={typography.bodyDim}>{s.summary}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: spacing.md },
  chevron: { color: colors.purpleSoft, fontSize: 26, marginLeft: spacing.sm },
});
