import React, { useLayoutEffect } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import StarryBackground from '../../components/StarryBackground';
import { Card } from '../../components/UI';
import { colors, spacing, typography } from '../../theme';
import { getArticle, getCategory } from './learnContent';

export default function LearnArticleScreen({ route, navigation }) {
  const { categoryId, articleId } = route.params || {};
  const article = getArticle(categoryId, articleId);
  const category = getCategory(categoryId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: article ? article.title : '' });
  }, [navigation, article]);

  if (!article) return null;

  return (
    <StarryBackground seed={22}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.category}>
          {category?.emoji} {category?.title}
        </Text>
        <Text style={typography.h1}>{article.title}</Text>
        {article.note ? <Text style={styles.note}>{article.note}</Text> : null}

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={typography.h3}>Contenido en revisión — próximamente</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            Estamos preparando contenido cuidado y revisado para este artículo.
            Queremos que sea claro, honesto y sin susto.
          </Text>
          <Text style={[typography.bodyDim, { marginTop: spacing.md, fontStyle: 'italic' }]}>
            Recuerda: lo que encuentres acá es informativo. Ante cualquier duda
            importante sobre tu cuerpo, siempre puedes consultar con tu matrona
            o un profesional de salud de confianza.
          </Text>
        </Card>
      </ScrollView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  category: { color: colors.textDim, fontSize: 12, letterSpacing: 0.5, marginBottom: 4 },
  note: { color: colors.textFaint, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
});
