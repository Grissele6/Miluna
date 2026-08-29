import React, { useLayoutEffect } from 'react';
import { Text, ScrollView, StyleSheet, Pressable, View } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card } from '../../components/UI';
import { colors, spacing, typography } from '../../theme';
import { getCategory } from './learnContent';

export default function LearnCategoryScreen({ route, navigation }) {
  const id = route?.params?.id;
  const category = getCategory(id);

  useLayoutEffect(() => {
    navigation.setOptions({ title: category ? category.title : 'Aprende' });
  }, [navigation, category]);

  if (!category) {
    return (
      <StarryBackground>
        <View style={styles.scroll}>
          <Text style={typography.body}>Categoría no encontrada.</Text>
        </View>
      </StarryBackground>
    );
  }

  return (
    <StarryBackground seed={17}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>{category.emoji}</Text>
        <Text style={typography.h1}>{category.title}</Text>
        <Text style={[typography.bodyDim, { marginTop: 4, marginBottom: spacing.md }]}>
          {category.summary}
        </Text>

        {category.articles.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => navigation.navigate('LearnArticle', { categoryId: category.id, articleId: a.id })}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.articleCard}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{a.title}</Text>
                  {a.note ? <Text style={styles.note}>{a.note}</Text> : null}
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
  scroll: { padding: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  emoji: { fontSize: 44, marginBottom: spacing.sm },
  articleCard: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  note: { color: colors.textFaint, fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  chevron: { color: colors.purpleSoft, fontSize: 26, marginLeft: spacing.sm },
});
